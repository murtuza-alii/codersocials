from django import forms
from .models import Post, Comment
from communities.models import Community


class PostCreateForm(forms.ModelForm):
    media_file = forms.FileField(
        label="Select Photo or Video (Optional)",
        required=False,
        widget=forms.FileInput(attrs={'accept': 'image/*,video/*', 'class': 'form-file-input'}),
        help_text="Supports JPG, PNG, WEBP, MP4, MOV, WEBM. Leave empty for text-only thoughts."
    )
    tag = forms.CharField(
        max_length=50,
        required=False,
        widget=forms.TextInput(attrs={'placeholder': 'e.g. #announcement, #question, #rant, #news', 'class': 'form-input'})
    )

    class Meta:
        model = Post
        fields = ['community', 'tag', 'caption', 'media_file']
        widgets = {
            'community': forms.Select(attrs={'class': 'form-select'}),
            'caption': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Share your thoughts, announcement, or question...'}),
        }

    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        if user and user.is_authenticated:
            from communities.models import CommunityMembership
            approved_comms = CommunityMembership.objects.filter(
                user=user, status='APPROVED'
            ).values_list('community_id', flat=True)
            self.fields['community'].queryset = Community.objects.filter(id__in=approved_comms)
            self.fields['community'].empty_label = "General (No Community)"
        else:
            self.fields['community'].queryset = Community.objects.none()


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['text']
        widgets = {
            'text': forms.TextInput(attrs={'placeholder': 'Add a comment...', 'class': 'comment-input'}),
        }
