"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import logging
from urllib.parse import quote

from core.feature_flags import flag_set
from core.middleware import enforce_csrf_checks
from core.utils.common import load_func
from django.conf import settings
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.shortcuts import redirect, render, reverse
from django.utils.http import url_has_allowed_host_and_scheme
from organizations.forms import OrganizationSignupForm
from organizations.models import Organization
from rest_framework.authtoken.models import Token
from users import forms
from users.functions import login, proceed_registration

logger = logging.getLogger()


@login_required
def logout(request):
    auth.logout(request)

    if settings.LOGOUT_REDIRECT_URL:
        return redirect(settings.LOGOUT_REDIRECT_URL)

    if settings.HOSTNAME:
        redirect_url = settings.HOSTNAME
        if not redirect_url.endswith('/'):
            redirect_url += '/'
        return redirect(redirect_url)
    return redirect('/')


@enforce_csrf_checks
def user_signup(request):
    """Sign up page"""
    user = request.user
    next_page = request.GET.get('next')
    token = request.GET.get('token')
    
    # Debug logging to understand the issue
    if token:
        print(f"DEBUG: Token received: {token}")
        print(f"DEBUG: User authenticated: {user.is_authenticated}")
        if user.is_authenticated:
            print(f"DEBUG: User ID: {user.id}, Email: {user.email}")
            print(f"DEBUG: User active organization: {user.active_organization}")
        
        # Check which organization this token belongs to
        try:
            org = Organization.objects.get(token=token)
            print(f"DEBUG: Token belongs to organization: {org.title} (ID: {org.id})")
            print(f"DEBUG: Organization created by: {org.created_by}")
        except Organization.DoesNotExist:
            print(f"DEBUG: Token does not belong to any organization")

    # checks if the URL is a safe redirection.
    if not next_page or not url_has_allowed_host_and_scheme(url=next_page, allowed_hosts=request.get_host()):
        if flag_set('fflag_all_feat_dia_1777_ls_homepage_short', user):
            next_page = reverse('main')
        else:
            next_page = reverse('projects:project-index')

    user_form = forms.UserSignupForm()
    organization_form = OrganizationSignupForm()

    if user.is_authenticated:
        # If user is already logged in, don't process invite tokens
        # This prevents users from accidentally switching organizations via invite links
        print(f"DEBUG: User already authenticated, redirecting without processing token")
        return redirect(next_page)

    # make a new user
    if request.method == 'POST':
        organization = None
        if token:
            # Use the new secure token validation
            organization = Organization.get_by_valid_token(token)
            if not organization:
                raise PermissionDenied('Invalid or expired invite token')
        
        if settings.DISABLE_SIGNUP_WITHOUT_LINK is True:
            if not organization:
                raise PermissionDenied('Signup requires a valid invite link')

        user_form = forms.UserSignupForm(request.POST)
        organization_form = OrganizationSignupForm(request.POST)

        if user_form.is_valid():
            # Store the validated organization in the request for use in save_user
            request.validated_organization = organization
            redirect_response = proceed_registration(request, user_form, organization_form, next_page)
            if redirect_response:
                return redirect_response

    if flag_set('fflag_feat_front_lsdv_e_297_increase_oss_to_enterprise_adoption_short'):
        return render(
            request,
            'users/new-ui/user_signup.html',
            {
                'user_form': user_form,
                'organization_form': organization_form,
                'next': quote(next_page),
                'token': token,
                'found_us_options': forms.FOUND_US_OPTIONS,
                'elaborate': forms.FOUND_US_ELABORATE,
            },
        )

    return render(
        request,
        'users/user_signup.html',
        {
            'user_form': user_form,
            'organization_form': organization_form,
            'next': quote(next_page),
            'token': token,
        },
    )


@enforce_csrf_checks
def user_login(request):
    """Login page"""
    user = request.user
    next_page = request.GET.get('next')

    # checks if the URL is a safe redirection.
    if not next_page or not url_has_allowed_host_and_scheme(url=next_page, allowed_hosts=request.get_host()):
        if flag_set('fflag_all_feat_dia_1777_ls_homepage_short', user):
            next_page = reverse('main')
        else:
            next_page = reverse('projects:project-index')

    login_form = load_func(settings.USER_LOGIN_FORM)
    form = login_form()

    if user.is_authenticated:
        return redirect(next_page)

    if request.method == 'POST':
        form = login_form(request.POST)
        if form.is_valid():
            user = form.cleaned_data['user']
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            if form.cleaned_data['persist_session'] is not True:
                # Set the session to expire when the browser is closed
                request.session['keep_me_logged_in'] = False
                request.session.set_expiry(0)

            # Update user's last activity when they log in
            user.update_last_activity()
            
            # user is organization member
            org_pk = Organization.find_by_user(user).pk
            user.active_organization_id = org_pk
            user.save(update_fields=['active_organization'])
            return redirect(next_page)

    if flag_set('fflag_feat_front_lsdv_e_297_increase_oss_to_enterprise_adoption_short'):
        return render(request, 'users/new-ui/user_login.html', {'form': form, 'next': quote(next_page)})

    return render(request, 'users/user_login.html', {'form': form, 'next': quote(next_page)})


@login_required
def user_account(request):
    user = request.user

    if user.active_organization is None and 'organization_pk' not in request.session:
        return redirect(reverse('main'))

    form = forms.UserProfileForm(instance=user)
    token = Token.objects.get(user=user)

    if request.method == 'POST':
        form = forms.UserProfileForm(request.POST, instance=user)
        if form.is_valid():
            form.save()
            return redirect(reverse('user-account'))

    return render(
        request,
        'users/user_account.html',
        {'settings': settings, 'user': user, 'user_profile_form': form, 'token': token},
    )
