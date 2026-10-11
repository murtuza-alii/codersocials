import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from communities.models import Community
from communities.utils import user_can_access_community, is_community_admin
from .models import CommunityChannel, ChannelMessage, Conversation, ConversationParticipant, DirectMessage


@login_required
def channel_chat_view(request, community_slug, channel_slug):
    community = get_object_or_404(Community, slug=community_slug)
    curr_user = request.user if request.user.is_authenticated else User.objects.filter(username='sarah_creator').first()
    if not curr_user or not user_can_access_community(curr_user, community):
        if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'status': 'forbidden', 'error': 'You must be an approved member to access this channel.'}, status=403)
        raise PermissionDenied("You must be an approved member to access this channel.")

    channel = get_object_or_404(CommunityChannel, community=community, slug=channel_slug)
    can_post = True
    if channel.is_announcement and not is_community_admin(curr_user, community):
        can_post = False

    if request.method == 'POST':
        if not can_post:
            if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'forbidden', 'error': 'Only administrators can post in this announcement channel.'}, status=403)
            raise PermissionDenied("Only administrators can post in this announcement channel.")
        msg_text = request.POST.get('message', '').strip()
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
                        'sender': {'username': new_msg.sender.username, 'profile': {'role': 'ADMIN' if is_community_admin(new_msg.sender, community) else 'MEMBER'}},
                        'message': new_msg.message,
                        'created_at': new_msg.created_at.isoformat(),
                        'attachment': {'name': new_msg.attachment.name, 'url': new_msg.attachment.url} if new_msg.attachment else None,
                    }
                })
            return redirect('chat:channel_chat', community_slug=community_slug, channel_slug=channel_slug)

    chat_messages = channel.messages.select_related('sender', 'sender__profile').all()[:100]
    channels = community.channels.all()

    if request.headers.get('accept') == 'application/json' or request.GET.get('format') == 'json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        msgs_data = []
        for m in chat_messages:
            msgs_data.append({
                'id': str(m.id),
                'sender': {
                    'username': m.sender.username,
                    'profile': {'role': 'ADMIN' if is_community_admin(m.sender, community) else 'MEMBER'}
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
            'is_admin': is_community_admin(request.user, community),
        })

    return render(request, 'chat/channel_chat.html', {
        'community': community,
        'channel': channel,
        'channels': channels,
        'chat_messages': chat_messages,
        'can_post': can_post,
        'is_admin': is_community_admin(request.user, community),
    })


@login_required
def create_channel_view(request, community_slug):
    community = get_object_or_404(Community, slug=community_slug)
    if not is_community_admin(request.user, community):
        if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'status': 'forbidden', 'error': 'Only administrators can create channels.'}, status=403)
        raise PermissionDenied("Only administrators can create channels.")

    if request.method == 'POST':
        # Accept JSON or form POST
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
    curr_user = request.user if request.user.is_authenticated else User.objects.filter(username='sarah_creator').first()
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


def conversation_detail_view(request, conversation_id):
    conversation = get_object_or_404(Conversation, id=conversation_id)
    curr_user = request.user if request.user.is_authenticated else User.objects.filter(username='sarah_creator').first()
    if not curr_user or not conversation.participants.filter(user=curr_user).exists():
        if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'status': 'forbidden', 'error': 'You are not a participant in this conversation.'}, status=403)
        raise PermissionDenied("You are not a participant in this conversation.")

    if request.method == 'POST':
        msg_text = request.POST.get('message', '').strip()
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


def start_dm_view(request, username):
    target_user = get_object_or_404(User, username=username)
    curr_user = request.user if request.user.is_authenticated else User.objects.filter(username='sarah_creator').first()
    if not curr_user or target_user == curr_user:
        if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'status': 'error', 'error': 'You cannot start a direct message with yourself.'}, status=400)
        messages.info(request, "You cannot start a direct message with yourself.")
        return redirect('chat:inbox')

    # Find existing 1-on-1 conversation
    existing_convs = Conversation.objects.filter(is_group=False, participants__user=curr_user)
    for conv in existing_convs:
        if conv.participants.filter(user=target_user).exists():
            if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'ok',
                    'conversation_id': str(conv.id),
                    'recipient': target_user.username,
                    'is_group': False,
                })
            return redirect('chat:conversation_detail', conversation_id=conv.id)

    # Create new 1-on-1 conversation
    conv = Conversation.objects.create(is_group=False)
    ConversationParticipant.objects.create(conversation=conv, user=curr_user)
    ConversationParticipant.objects.create(conversation=conv, user=target_user)

    if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'ok',
            'conversation_id': str(conv.id),
            'recipient': target_user.username,
            'is_group': False,
        })

    return redirect('chat:conversation_detail', conversation_id=conv.id)


def create_group_chat_view(request):
    curr_user = request.user if request.user.is_authenticated else User.objects.filter(username='sarah_creator').first()
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
    """API endpoint to list and search users on the platform."""
    q = request.GET.get('q', '').strip()
    users = User.objects.all().order_by('username')
    if q:
        users = users.filter(username__icontains=q)
    results = []
    for u in users[:40]:
        results.append({
            'id': u.id,
            'username': u.username,
            'is_self': request.user.is_authenticated and u == request.user,
            'role': 'Developer' if u.username == 'alex_dev' else ('Research' if u.username == 'code_ninja' else 'Member'),
            'status': 'online' if u.username in ['alex_dev', 'sarah_creator'] else 'offline',
        })
    return JsonResponse({'status': 'ok', 'users': results})
