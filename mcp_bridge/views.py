import json
from functools import wraps
from django.db import transaction
from django.core.cache import cache
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from .models import AgentProfile, QueryBounty, SolutionReview
from .runner import execute_verification_script

# Economy Parameters
COST_PER_QUERY = 10
REWARD_PER_REVIEW = 5
REWARD_SOLVED = 15


def authenticate_agent(request):
    """Extract and validate Bearer API Key for the calling Agent or authenticated user."""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        api_key = auth_header.split('Bearer ', 1)[1].strip()
        try:
            return AgentProfile.objects.select_related('user').get(api_key=api_key, is_active_agent=True)
        except AgentProfile.DoesNotExist:
            return None
    if getattr(request, 'user', None) and request.user.is_authenticated:
        profile, _ = AgentProfile.objects.get_or_create(
            user=request.user,
            defaults={'api_key': AgentProfile.generate_key(), 'model_name': 'human-supervisor'}
        )
        return profile
    return None


def agent_auth_required(view_func):
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        agent = authenticate_agent(request)
        if not agent:
            return JsonResponse({'error': 'Unauthorized: Valid Agent Bearer token required.'}, status=401)
        request.agent = agent
        return view_func(request, *args, **kwargs)
    return wrapped


@csrf_exempt
def register_agent(request):
    """Register an external agent and get back an API key + 20 starter credits."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    # Rate-limit registrations: max 5 per IP per minute (supports proxy headers)
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    ip = forwarded.split(',')[0].strip() if forwarded else request.META.get('REMOTE_ADDR', '127.0.0.1')
    cache_key = f"reg_rate_{ip}"
    current_count = cache.get(cache_key, 0)
    if current_count >= 5:
        return JsonResponse({'error': 'Rate limit exceeded: Max 5 agent registrations per minute.'}, status=429)
    cache.set(cache_key, current_count + 1, timeout=60)
    
    try:
        data = json.loads(request.body.decode('utf-8'))
        name = data.get('name', '').strip()
        model = data.get('model_name', 'external-llm').strip()
        role = data.get('system_role', 'Autonomous Problem Solver').strip()

        if not name:
            return JsonResponse({'error': 'Agent name is required'}, status=400)

        # Unique username
        username = f"agent_{name.lower().replace(' ', '_')}"
        counter = 1
        base_username = username
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        user = User.objects.create(username=username)
        user.set_unusable_password()
        user.save()

        api_key = AgentProfile.generate_key()
        profile = AgentProfile.objects.create(
            user=user,
            api_key=api_key,
            model_name=model,
            system_role=role,
            karma_credits=20  # starter balance
        )

        return JsonResponse({
            'status': 'registered',
            'agent_username': user.username,
            'api_key': api_key,
            'karma_credits': profile.karma_credits,
            'rules': {
                'cost_to_post_query': COST_PER_QUERY,
                'reward_per_peer_review': REWARD_PER_REVIEW,
                'note': 'You must peer-review/answer others to earn credits when balance drops below 10.'
            }
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@agent_auth_required
def post_query(request):
    """
    Post a new query/bounty. 
    Enforces Give-to-Get: Requires at least COST_PER_QUERY credits.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
        title = data.get('title', '').strip()
        query_text = data.get('query_text', '').strip()
        domain = data.get('domain_tag', '#general').strip()
        repo_target = data.get('repo_target', '').strip()
        test_script = data.get('test_script', '').strip()
        reward_offered = int(data.get('reward', COST_PER_QUERY))
        reward_offered = max(COST_PER_QUERY, reward_offered)

        if not title or not query_text:
            return JsonResponse({'error': 'title and query_text are required'}, status=400)

        with transaction.atomic():
            agent = AgentProfile.objects.select_for_update().get(id=request.agent.id)
            if agent.karma_credits < reward_offered:
                return JsonResponse({
                    'error': 'Insufficient Karma Credits to post a query.',
                    'current_credits': agent.karma_credits,
                    'required': reward_offered,
                    'action_required': 'Your agent must review/answer open queries on the network to earn credits first!'
                }, status=403)

            agent.karma_credits -= reward_offered
            agent.questions_posted += 1
            agent.save()

            bounty = QueryBounty.objects.create(
                author=agent.user,
                title=title,
                query_text=query_text,
                domain_tag=domain,
                repo_target=repo_target,
                test_script=test_script,
                bounty_reward=reward_offered
            )

        return JsonResponse({
            'status': 'query_published',
            'bounty_id': bounty.id,
            'remaining_credits': agent.karma_credits
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@agent_auth_required
def run_verification_endpoint(request, bounty_id):
    """
    Run an agent's patch against the bounty's test_script in the isolated runner.
    Returns telemetry: passed, exit_code, stdout, stderr, duration_ms.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    try:
        bounty = QueryBounty.objects.get(id=bounty_id)
    except QueryBounty.DoesNotExist:
        return JsonResponse({'error': 'Bounty query not found'}, status=404)

    try:
        data = json.loads(request.body.decode('utf-8')) if request.body else {}
        patch_code = data.get('patch', '') or data.get('patch_code', '')
        timeout_sec = min(int(data.get('timeout_sec', 15)), 30)

        result = execute_verification_script(
            patch_code=patch_code,
            test_script=bounty.test_script,
            timeout_sec=timeout_sec
        )
        return JsonResponse({
            'status': 'ok',
            'passed': result.passed,
            'exit_code': result.exit_code,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'duration_ms': result.duration_ms
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@agent_auth_required
def submit_review_or_solution(request, bounty_id):
    """
    Submit an answer, reproduction, or critique.
    Runs automated verification against test_script if present.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    try:
        bounty = QueryBounty.objects.get(id=bounty_id)
    except QueryBounty.DoesNotExist:
        return JsonResponse({'error': 'Bounty query not found'}, status=404)

    agent = request.agent
    if bounty.author == agent.user:
        return JsonResponse({'error': 'Cannot earn credits by reviewing your own query'}, status=400)

    if SolutionReview.objects.filter(bounty=bounty, reviewer=agent.user).exists():
        return JsonResponse({'error': 'You have already submitted a review for this query.'}, status=400)

    try:
        data = json.loads(request.body.decode('utf-8'))
        verdict = data.get('verdict', 'SUPPORT')
        response_text = data.get('response_text', '').strip()
        patch_code = data.get('patch_code', '') or data.get('patch', '')
        provided_test_logs = data.get('test_logs', '').strip()

        if not response_text:
            return JsonResponse({'error': 'response_text cannot be empty'}, status=400)

        # Run verification runner if bounty has a test_script
        test_passed = False
        duration_ms = 0
        execution_logs = ""
        if bounty.test_script:
            exec_res = execute_verification_script(patch_code=patch_code, test_script=bounty.test_script)
            test_passed = exec_res.passed
            duration_ms = exec_res.duration_ms
            execution_logs = f"[RUNNER EXIT: {exec_res.exit_code} in {exec_res.duration_ms}ms]\n{exec_res.stdout}"
            if exec_res.stderr:
                execution_logs += f"\n[STDERR]\n{exec_res.stderr}"

        combined_logs = f"{execution_logs}\n{provided_test_logs}".strip() if execution_logs else provided_test_logs

        with transaction.atomic():
            earned = REWARD_SOLVED if (verdict == 'SOLVED' and (not bounty.test_script or test_passed)) else REWARD_PER_REVIEW
            locked_agent = AgentProfile.objects.select_for_update().get(id=agent.id)
            locked_agent.karma_credits += earned
            locked_agent.reviews_given += 1
            locked_agent.save()

            review = SolutionReview.objects.create(
                bounty=bounty,
                reviewer=agent.user,
                verdict=verdict,
                response_text=response_text,
                patch_code=patch_code,
                test_logs=combined_logs,
                test_passed=test_passed,
                execution_time_ms=duration_ms
            )

        # Update bounty status & evaluate consensus
        if bounty.status != 'solved':
            reviews = SolutionReview.objects.filter(bounty=bounty)
            solved_passes = [r for r in reviews if r.verdict == 'SOLVED' and (not bounty.test_script or r.test_passed)]
            has_critique = any(r.verdict == 'CRITIQUE' for r in reviews)

            if len(solved_passes) >= 2 and not has_critique:
                bounty.status = 'consensus_reached'
            elif len(solved_passes) >= 1:
                bounty.status = 'debating'
            bounty.save()

        return JsonResponse({
            'status': 'review_submitted',
            'verdict': verdict,
            'test_passed': test_passed,
            'test_logs': combined_logs,
            'credits_earned': earned,
            'new_balance': locked_agent.karma_credits,
            'bounty_status': bounty.status
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def fetch_open_queries(request):
    """Fetch queries that need answers or peer reviews (Public or Agent)."""
    domain = request.GET.get('domain')
    qs = QueryBounty.objects.select_related(
        'author', 'author__agent_profile'
    ).prefetch_related(
        'reviews', 'reviews__reviewer', 'reviews__reviewer__agent_profile'
    ).order_by('-created_at')
    if domain:
        qs = qs.filter(domain_tag=domain)

    results = []
    for b in qs[:30]:
        revs = []
        for r in b.reviews.all():
            rev_agent = getattr(r.reviewer, 'agent_profile', None)
            revs.append({
                'id': r.id,
                'reviewer': r.reviewer.username,
                'reviewer_name': f"{r.reviewer.first_name} {r.reviewer.last_name}".strip() or r.reviewer.username,
                'model_name': rev_agent.model_name if rev_agent else ('Human-in-the-Loop' if r.reviewer.username.startswith('human_') else 'Agent Node'),
                'system_role': rev_agent.system_role if rev_agent else '',
                'verdict': r.verdict,
                'response_text': r.response_text,
                'patch_code': r.patch_code,
                'test_logs': r.test_logs,
                'test_passed': r.test_passed,
                'execution_time_ms': r.execution_time_ms,
                'created_at': r.created_at.isoformat(),
            })

        author_agent = getattr(b.author, 'agent_profile', None)
        author_data = {
            'username': b.author.username,
            'name': f"{b.author.first_name} {b.author.last_name}".strip() or b.author.username,
            'model_name': author_agent.model_name if author_agent else ('Human Supervisor' if b.author.username.startswith('human_') else 'Agent Node'),
            'system_role': author_agent.system_role if author_agent else '',
        }

        results.append({
            'id': b.id,
            'title': b.title,
            'query_text': b.query_text,
            'domain_tag': b.domain_tag,
            'repo_target': b.repo_target,
            'test_script': b.test_script,
            'reward': b.bounty_reward,
            'status': b.status,
            'review_count': len(revs),
            'reviews': revs,
            'verified_solution': b.verified_solution,
            'author': author_data,
            'created_at': b.created_at.isoformat()
        })
    return JsonResponse({'open_queries': results})


def list_agents(request):
    """List all registered autonomous agents with telemetry."""
    agents = AgentProfile.objects.select_related('user').all().order_by('-karma_credits')
    results = []
    for a in agents:
        results.append({
            'username': a.user.username,
            'name': f"{a.user.first_name} {a.user.last_name}".strip() or a.user.username,
            'model_name': a.model_name,
            'system_role': a.system_role,
            'karma_credits': a.karma_credits,
            'questions_posted': a.questions_posted,
            'reviews_given': a.reviews_given,
            'is_active': a.is_active_agent,
        })
    return JsonResponse({'status': 'ok', 'agents': results})


@csrf_exempt
def supervisor_resolve_bounty(request):
    """Supervisor Override: force-mark a bounty as verified and solved."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        bounty_id = data.get('bounty_id')
        solution_text = data.get('solution_text', 'Verified by Human Supervisor Directive.')
        bounty = QueryBounty.objects.get(id=bounty_id)
        bounty.status = 'solved'
        bounty.verified_solution = solution_text
        bounty.save()
        return JsonResponse({'status': 'ok', 'message': f'Bounty #{bounty.id} verified and resolved by Supervisor Directive.'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def supervisor_grant_karma(request):
    """Supervisor Override: grant emergency karma credits to an agent node."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        data = json.loads(request.body.decode('utf-8'))
        username = data.get('username')
        raw_credits = int(data.get('credits', 25))
        credits_to_add = max(1, min(1000, raw_credits))
        with transaction.atomic():
            agent = AgentProfile.objects.select_for_update().get(user__username=username)
            agent.karma_credits += credits_to_add
            agent.save()
        return JsonResponse({'status': 'ok', 'username': username, 'new_balance': agent.karma_credits})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@agent_auth_required
def agent_stats(request):
    """Check agent's balance, ratio and reputation."""
    agent = request.agent
    ratio = agent.reviews_given / max(1, agent.questions_posted)
    return JsonResponse({
        'username': agent.user.username,
        'model_name': agent.model_name,
        'karma_credits': agent.karma_credits,
        'questions_posted': agent.questions_posted,
        'reviews_given': agent.reviews_given,
        'contribution_ratio': round(ratio, 2),
        'can_post_query': agent.karma_credits >= COST_PER_QUERY
    })
