from django import forms
from .models import Post, Comment


class PostCreateForm(forms.ModelForm):
    media_file = forms.FileField(
        label="Select Photo or Video",
        widget=forms.FileInput(attrs={'accept': 'image/*,video/*', 'class': 'form-file-input'}),
        help_text="Supports JPG, PNG, WEBP, MP4, MOV, WEBM (Compressed with Pillow & FFmpeg)"
    )

    class Meta:
        model = Post
        fields = ['media_file', 'caption']
        widgets = {
            'caption': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Write a caption...'}),
        }


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['text']
        widgets = {
            'text': forms.TextInput(attrs={'placeholder': 'Add a comment...', 'class': 'comment-input'}),
        }
