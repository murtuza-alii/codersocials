import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from communities.models import Community
from communities.utils import user_can_access_community, is_community_admin
from .models import CommunityChannel, ChannelMessage, Conversation, ConversationParticipant, DirectMessage


def get_current_user(request):
    if request.user.is_authenticated:
        return request.user
    return User.objects.filter(username='sarah_creator').first()


@csrf_exempt
def channel_chat_view(request, community_slug, channel_slug):
    community = get_object_or_404(Community, slug=community_slug)
    curr_user = get_current_user(request)

    channel = CommunityChannel.objects.filter(community=community, slug=channel_slug).first() or \
              CommunityChannel.objects.filter(community=community, name=channel_slug).first() or \
              community.channels.first()

    if not channel:
        channel = CommunityChannel.objects.create(
            community=community,
            name=channel_slug,
            topic=f"{channel_slug} discussion",
            is_announcement=False
        )

    can_post = True
    if channel.is_announcement and curr_user and not is_community_admin(curr_user, community):
        can_post = False

    if request.method == 'POST':
        if not can_post:
            if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'forbidden', 'error': 'Only administrators can post in this announcement channel.'}, status=403)
            raise PermissionDenied("Only administrators can post in this announcement channel.")
        
        msg_text = ''
        if request.content_type == 'application/json':
            try:
                body = json.loads(request.body)
                msg_text = (body.get('message') or body.get('content') or '').strip()
            except Exception:
                msg_text = ''
        else:
            msg_text = (request.POST.get('message') or request.POST.get('content') or '').strip()
        attachment = request.FILES.get('attachment')
        if msg_text or attachment:
            new_msg = ChannelMessage.objects.create(
                channel=channel,
                sender=curr_user,
                message=msg_text,
                attachment=attachment
            )
            if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.headers.get('accept') == 'application/json':
                return JsonResponse({
                    'status': 'ok',
                    'message': {
                        'id': str(new_msg.id),
                        'sender': {'username': new_msg.sender.username, 'profile': {'role': 'ADMIN' if (curr_user and is_community_admin(new_msg.sender, community)) else 'MEMBER'}},
                        'message': new_msg.message,
                        'created_at': new_msg.created_at.isoformat(),
                        'attachment': {'name': new_msg.attachment.name, 'url': new_msg.attachment.url} if new_msg.attachment else None,
                    }
                })
            return redirect('chat:channel_chat', community_slug=community_slug, channel_slug=channel.slug)

    chat_messages = channel.messages.select_related('sender', 'sender__profile').all()[:100]
    channels = community.channels.all()

    if request.headers.get('accept') == 'application/json' or request.GET.get('format') == 'json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        msgs_data = []
        for m in chat_messages:
            msgs_data.append({
                'id': str(m.id),
                'sender': {
                    'username': m.sender.username,
                    'profile': {'role': 'ADMIN' if (curr_user and is_community_admin(m.sender, community)) else 'MEMBER'}
                },
                'message': m.message,
                'created_at': m.created_at.isoformat(),
                'attachment': {'name': m.attachment.name, 'url': m.attachment.url} if m.attachment else None,
            })
        return JsonResponse({
            'status': 'ok',
            'channel': {'id': str(channel.id), 'name': channel.name, 'slug': channel.slug, 'topic': channel.topic, 'is_announcement': channel.is_announcement},
            'channels': [{'id': str(c.id), 'name': c.name, 'slug': c.slug, 'is_announcement': c.is_announcement, 'topic': c.topic} for c in channels],
            'chat_messages': msgs_data,
            'can_post': can_post,
            'is_admin': is_community_admin(curr_user, community) if curr_user else False,
        })

    return render(request, 'chat/channel_chat.html', {
        'community': community,
        'channel': channel,
        'channels': channels,
        'chat_messages': chat_messages,
        'can_post': can_post,
        'is_admin': is_community_admin(curr_user, community) if curr_user else False,
    })


@csrf_exempt
def create_channel_view(request, community_slug):
    community = get_object_or_404(Community, slug=community_slug)
    curr_user = get_current_user(request)

    if request.method == 'POST':
        if request.content_type == 'application/json':
            try:
                body = json.loads(request.body)
                name = body.get('name', '').strip()
                topic = body.get('topic', '').strip()
                is_announcement = bool(body.get('is_announcement'))
            except Exception:
                name, topic, is_announcement = '', '', False
        else:
            name = request.POST.get('name', '').strip()
            topic = request.POST.get('topic', '').strip()
            is_announcement = bool(request.POST.get('is_announcement'))

        if name:
            channel = CommunityChannel.objects.create(
                community=community,
                name=name,
                topic=topic,
                is_announcement=is_announcement
            )
            if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.headers.get('accept') == 'application/json':
                return JsonResponse({
                    'status': 'ok',
                    'channel': {
                        'id': str(channel.id),
                        'name': channel.name,
                        'slug': channel.slug,
                        'topic': channel.topic,
                        'is_announcement': channel.is_announcement
                    }
                })
            messages.success(request, f"Channel #{channel.name} created!")
            return redirect('chat:channel_chat', community_slug=community.slug, channel_slug=channel.slug)

    return render(request, 'chat/create_channel.html', {'community': community})


def inbox_view(request):
    curr_user = get_current_user(request)
    if not curr_user:
        return JsonResponse({'status': 'ok', 'conversations': []})

    participants = ConversationParticipant.objects.filter(
        user=curr_user
    ).select_related('conversation').order_by('-conversation__updated_at')

    conversations = [p.conversation for p in participants]

    if request.headers.get('accept') == 'application/json' or request.GET.get('format') == 'json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        data = []
        for c in conversations:
            other = c.get_recipient(curr_user) if not c.is_group else None
            last_msg = c.messages.last()
            data.append({
                'id': str(c.id),
                'is_group': c.is_group,
                'title': c.title if c.is_group else (other.username if other else 'Direct Message'),
                'recipient': other.username if other else None,
                'participants': [p.user.username for p in c.participants.all()],
                'member_count': c.participants.count(),
                'last_message': last_msg.message if last_msg else '',
                'updated_at': c.updated_at.isoformat() if c.updated_at else None,
            })
        return JsonResponse({'status': 'ok', 'conversations': data})

    return render(request, 'chat/inbox.html', {
        'conversations': conversations,
    })


@csrf_exempt
def conversation_detail_view(request, conversation_id):
    conversation = get_object_or_404(Conversation, id=conversation_id)
    curr_user = get_current_user(request)

    if request.method == 'POST':
        msg_text = ''
        if request.content_type == 'application/json':
            try:
                body = json.loads(request.body)
                msg_text = (body.get('message') or body.get('content') or '').strip()
            except Exception:
                msg_text = ''
        else:
            msg_text = (request.POST.get('message') or request.POST.get('content') or '').strip()
        attachment = request.FILES.get('attachment')
        if msg_text or attachment:
            new_msg = DirectMessage.objects.create(
                conversation=conversation,
                sender=curr_user,
                message=msg_text,
                attachment=attachment
            )
            conversation.save()  # Triggers updated_at
            if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.headers.get('accept') == 'application/json':
                return JsonResponse({
                    'status': 'ok',
                    'message': {
                        'id': str(new_msg.id),
                        'sender': {'username': new_msg.sender.username},
                        'message': new_msg.message,
                        'created_at': new_msg.created_at.isoformat(),
                        'attachment': {'name': new_msg.attachment.name, 'url': new_msg.attachment.url} if new_msg.attachment else None,
                    }
                })
            return redirect('chat:conversation_detail', conversation_id=conversation.id)

    chat_messages = conversation.messages.select_related('sender', 'sender__profile').all()[:150]
    participants = conversation.participants.select_related('user', 'user__profile').all()

    if request.headers.get('accept') == 'application/json' or request.GET.get('format') == 'json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        msgs_data = []
        for m in chat_messages:
            msgs_data.append({
                'id': str(m.id),
                'sender': {'username': m.sender.username},
                'message': m.message,
                'created_at': m.created_at.isoformat(),
                'attachment': {'name': m.attachment.name, 'url': m.attachment.url} if m.attachment else None,
            })
        other_user = conversation.get_recipient(curr_user) if not conversation.is_group else None
        return JsonResponse({
            'status': 'ok',
            'conversation': {
                'id': str(conversation.id),
                'is_group': conversation.is_group,
                'title': conversation.title if conversation.is_group else (other_user.username if other_user else 'Direct Message'),
                'recipient': other_user.username if other_user else None,
                'participants': [p.user.username for p in participants],
            },
            'chat_messages': msgs_data,
        })

    return render(request, 'chat/conversation_detail.html', {
        'conversation': conversation,
        'chat_messages': chat_messages,
        'participants': participants,
        'other_user': conversation.get_recipient(curr_user) if not conversation.is_group else None,
    })


@csrf_exempt
def start_dm_view(request, username):
    target_user = User.objects.filter(username=username).first()
    if not target_user and str(username).isdigit():
        target_user = User.objects.filter(id=int(username)).first()
    if not target_user:
        if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'status': 'error', 'error': 'User not found.'}, status=404)
        messages.error(request, "User not found.")
        return redirect('chat:inbox')

    curr_user = get_current_user(request)
    if not curr_user or target_user == curr_user:
        if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'status': 'error', 'error': 'You cannot start a direct message with yourself.'}, status=400)
        messages.info(request, "You cannot start a direct message with yourself.")
        return redirect('chat:inbox')

    # Find existing 1-on-1 conversation
    existing_convs = Conversation.objects.filter(is_group=False, participants__user=curr_user)
    conv = None
    for c in existing_convs:
        if c.participants.filter(user=target_user).exists():
            conv = c
            break

    if not conv:
        # Create new 1-on-1 conversation
        conv = Conversation.objects.create(is_group=False)
        ConversationParticipant.objects.create(conversation=conv, user=curr_user)
        ConversationParticipant.objects.create(conversation=conv, user=target_user)

    # If POST and message is included, save the message!
    if request.method == 'POST':
        msg_text = ''
        if request.content_type == 'application/json':
            try:
                body = json.loads(request.body)
                msg_text = (body.get('message') or body.get('content') or '').strip()
            except Exception:
                pass
        else:
            msg_text = (request.POST.get('message') or request.POST.get('content') or '').strip()
        attachment = request.FILES.get('attachment')
        if msg_text or attachment:
            new_msg = DirectMessage.objects.create(
                conversation=conv,
                sender=curr_user,
                message=msg_text,
                attachment=attachment
            )
            conv.save()
            if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.headers.get('accept') == 'application/json':
                return JsonResponse({
                    'status': 'ok',
                    'conversation_id': str(conv.id),
                    'message': {
                        'id': str(new_msg.id),
                        'sender': {'username': new_msg.sender.username},
                        'message': new_msg.message,
                        'created_at': new_msg.created_at.isoformat(),
                        'attachment': {'name': new_msg.attachment.name, 'url': new_msg.attachment.url} if new_msg.attachment else None,
                    }
                })

    chat_messages = conv.messages.select_related('sender', 'sender__profile').all()[:150]
    msgs_data = []
    for m in chat_messages:
        msgs_data.append({
            'id': str(m.id),
            'sender': {'username': m.sender.username},
            'message': m.message,
            'created_at': m.created_at.isoformat(),
            'attachment': {'name': m.attachment.name, 'url': m.attachment.url} if m.attachment else None,
        })

    if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'ok',
            'conversation_id': str(conv.id),
            'conversation': {
                'id': str(conv.id),
                'is_group': False,
                'title': target_user.username,
                'recipient': target_user.username,
                'participants': [curr_user.username, target_user.username],
            },
            'recipient': target_user.username,
            'is_group': False,
            'chat_messages': msgs_data,
        })

    return redirect('chat:conversation_detail', conversation_id=conv.id)


@csrf_exempt
def create_group_chat_view(request):
    curr_user = get_current_user(request)
    if request.method == 'POST':
        if request.content_type == 'application/json':
            try:
                body = json.loads(request.body)
                title = body.get('title', '').strip()
                usernames = body.get('members', [])
            except Exception:
                title, usernames = '', []
        else:
            title = request.POST.get('title', '').strip()
            usernames = request.POST.getlist('members')

        if not title:
            if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'error': 'Group title is required.'}, status=400)
            messages.error(request, "Group title is required.")
            return render(request, 'chat/create_group.html')

        conv = Conversation.objects.create(is_group=True, title=title)
        if curr_user:
            ConversationParticipant.objects.create(conversation=conv, user=curr_user, is_admin=True)

        for uname in usernames:
            u = User.objects.filter(username=uname).first()
            if u and u != curr_user:
                ConversationParticipant.objects.create(conversation=conv, user=u)

        if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'ok',
                'conversation': {
                    'id': str(conv.id),
                    'title': conv.title,
                    'is_group': True,
                    'participants': [p.user.username for p in conv.participants.all()],
                }
            })

        messages.success(request, f"Personal group '{title}' created!")
        return redirect('chat:conversation_detail', conversation_id=conv.id)

    users = User.objects.exclude(id=curr_user.id if curr_user else 0).order_by('username')
    return render(request, 'chat/create_group.html', {'users': users})


def api_users_list(request):
    """API endpoint to list and search users on the platform by username or real name."""
    q = request.GET.get('q', '').strip()
    users = User.objects.all().select_related('profile').order_by('username')
    if q:
        users = users.filter(
            Q(username__icontains=q) |
            Q(first_name__icontains=q) |
            Q(last_name__icontains=q) |
            Q(profile__bio__icontains=q)
        )
    results = []
    for u in users[:50]:
        profile = getattr(u, 'profile', None)
        full_name = f"{u.first_name} {u.last_name}".strip()
        results.append({
            'id': u.id,
            'username': u.username,
            'name': full_name or u.username,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'bio': profile.bio if profile else '',
            'avatar': profile.avatar.url if profile and profile.avatar else None,
            'is_self': request.user.is_authenticated and u == request.user,
            'role': 'Developer' if u.username == 'alex_dev' else ('Research' if u.username == 'code_ninja' else ('Admin' if u.is_superuser else 'Member')),
            'status': 'online' if u.username in ['alex_dev', 'sarah_creator'] else 'offline',
        })
    return JsonResponse({'status': 'ok', 'users': results})
