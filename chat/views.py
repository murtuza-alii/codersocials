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
    if not user_can_access_community(request.user, community):
        raise PermissionDenied("You must be an approved member to access this channel.")

    channel = get_object_or_404(CommunityChannel, community=community, slug=channel_slug)
    can_post = True
    if channel.is_announcement and not is_community_admin(request.user, community):
        can_post = False

    if request.method == 'POST':
        if not can_post:
            raise PermissionDenied("Only administrators can post in this announcement channel.")
        msg_text = request.POST.get('message', '').strip()
        attachment = request.FILES.get('attachment')
        if msg_text or attachment:
            ChannelMessage.objects.create(
                channel=channel,
                sender=request.user,
                message=msg_text,
                attachment=attachment
            )
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'ok'})
            return redirect('chat:channel_chat', community_slug=community_slug, channel_slug=channel_slug)

    chat_messages = channel.messages.select_related('sender', 'sender__profile').all()[:100]
    channels = community.channels.all()

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
        raise PermissionDenied("Only administrators can create channels.")

    if request.method == 'POST':
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
            messages.success(request, f"Channel #{channel.name} created!")
            return redirect('chat:channel_chat', community_slug=community.slug, channel_slug=channel.slug)

    return render(request, 'chat/create_channel.html', {'community': community})


@login_required
def inbox_view(request):
    participants = ConversationParticipant.objects.filter(
        user=request.user
    ).select_related('conversation').order_by('-conversation__updated_at')

    conversations = [p.conversation for p in participants]

    return render(request, 'chat/inbox.html', {
        'conversations': conversations,
    })


@login_required
def conversation_detail_view(request, conversation_id):
    conversation = get_object_or_404(Conversation, id=conversation_id)
    if not conversation.participants.filter(user=request.user).exists():
        raise PermissionDenied("You are not a participant in this conversation.")

    if request.method == 'POST':
        msg_text = request.POST.get('message', '').strip()
        attachment = request.FILES.get('attachment')
        if msg_text or attachment:
            DirectMessage.objects.create(
                conversation=conversation,
                sender=request.user,
                message=msg_text,
                attachment=attachment
            )
            conversation.save()  # Triggers updated_at
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'ok'})
            return redirect('chat:conversation_detail', conversation_id=conversation.id)

    chat_messages = conversation.messages.select_related('sender', 'sender__profile').all()[:150]
    participants = conversation.participants.select_related('user', 'user__profile').all()

    return render(request, 'chat/conversation_detail.html', {
        'conversation': conversation,
        'chat_messages': chat_messages,
        'participants': participants,
        'other_user': conversation.get_recipient(request.user) if not conversation.is_group else None,
    })


@login_required
def start_dm_view(request, username):
    target_user = get_object_or_404(User, username=username)
    if target_user == request.user:
        messages.info(request, "You cannot start a direct message with yourself.")
        return redirect('chat:inbox')

    # Find existing 1-on-1 conversation
    existing_convs = Conversation.objects.filter(is_group=False, participants__user=request.user)
    for conv in existing_convs:
        if conv.participants.filter(user=target_user).exists():
            return redirect('chat:conversation_detail', conversation_id=conv.id)

    # Create new 1-on-1 conversation
    conv = Conversation.objects.create(is_group=False)
    ConversationParticipant.objects.create(conversation=conv, user=request.user)
    ConversationParticipant.objects.create(conversation=conv, user=target_user)

    return redirect('chat:conversation_detail', conversation_id=conv.id)


@login_required
def create_group_chat_view(request):
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        usernames = request.POST.getlist('members')

        if not title:
            messages.error(request, "Group title is required.")
            return render(request, 'chat/create_group.html')

        conv = Conversation.objects.create(is_group=True, title=title)
        ConversationParticipant.objects.create(conversation=conv, user=request.user, is_admin=True)

        for uname in usernames:
            u = User.objects.filter(username=uname).first()
            if u and u != request.user:
                ConversationParticipant.objects.create(conversation=conv, user=u)

        messages.success(request, f"Personal group '{title}' created!")
        return redirect('chat:conversation_detail', conversation_id=conv.id)

    users = User.objects.exclude(id=request.user.id).order_by('username')
    return render(request, 'chat/create_group.html', {'users': users})
