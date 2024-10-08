import React, { FunctionComponent, useCallback, useEffect, useRef } from 'react';
import Dashboard from '../../../utils/dashboard';
import globalize from '../../../lib/globalize';
import LibraryMenu from '../../../scripts/libraryMenu';
import confirm from '../../confirm/confirm';
import loading from '../../loading/loading';
import toast from '../../toast/toast';
import ButtonElement from '../../../elements/ButtonElement';
import InputElement from '../../../elements/InputElement';
import IconButtonElement from 'elements/IconButtonElement';
import './UserPasswordForm.scss';

type IProps = {
    userId: string | null;
};

const UserPasswordForm: FunctionComponent<IProps> = ({ userId }: IProps) => {
    const element = useRef<HTMLDivElement>(null);

    const loadUser = useCallback(async () => {
        const page = element.current;

        if (!page) {
            console.error('[UserPasswordForm] Unexpected null page reference');
            return;
        }

        if (!userId) {
            console.error('[UserPasswordForm] missing user id');
            return;
        }

        const user = await window.ApiClient.getUser(userId);
        const loggedInUser = await Dashboard.getCurrentUser();

        if (!user.Policy || !user.Configuration) {
            throw new Error('Unexpected null user policy or configuration');
        }

        LibraryMenu.setTitle(user.Name);

        if (user.HasConfiguredPassword) {
            if (!user.Policy?.IsAdministrator) {
                (page.querySelector('#btnResetPassword') as HTMLDivElement).classList.remove('hide');
            }
            (page.querySelector('#fldCurrentPassword') as HTMLDivElement).classList.remove('hide');
        } else {
            (page.querySelector('#btnResetPassword') as HTMLDivElement).classList.add('hide');
            (page.querySelector('#fldCurrentPassword') as HTMLDivElement).classList.add('hide');
        }

        const canChangePassword = loggedInUser?.Policy?.IsAdministrator || user.Policy.EnableUserPreferenceAccess;
        (page.querySelector('.passwordSection') as HTMLDivElement).classList.toggle('hide', !canChangePassword);

        import('../../autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(page);
        }).catch(err => {
            console.error('[UserPasswordForm] failed to load autofocuser', err);
        });

        (page.querySelector('#txtCurrentPassword') as HTMLInputElement).value = '';
        (page.querySelector('#txtNewPassword') as HTMLInputElement).value = '';
        (page.querySelector('#txtNewPasswordConfirm') as HTMLInputElement).value = '';
    }, [userId]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('[UserPasswordForm] Unexpected null page reference');
            return;
        }

        loadUser().catch(err => {
            console.error('[UserPasswordForm] failed to load user', err);
        });

        const onSubmit = (e: Event) => {
            if ((page.querySelector('#txtNewPassword') as HTMLInputElement).value != (page.querySelector('#txtNewPasswordConfirm') as HTMLInputElement).value) {
                toast(globalize.translate('PasswordMatchError'));
            } else {
                loading.show();
                savePassword();
            }

            e.preventDefault();
            return false;
        };

        const savePassword = () => {
            if (!userId) {
                console.error('[UserPasswordForm.savePassword] missing user id');
                return;
            }

            let currentPassword = (page.querySelector('#txtCurrentPassword') as HTMLInputElement).value;
            const newPassword = (page.querySelector('#txtNewPassword') as HTMLInputElement).value;

            if ((page.querySelector('#fldCurrentPassword') as HTMLDivElement).classList.contains('hide')) {
                // Firefox does not respect autocomplete=off, so clear it if the field is supposed to be hidden (and blank)
                // This should only happen when user.HasConfiguredPassword is false, but this information is not passed on
                currentPassword = '';
            }

            window.ApiClient.updateUserPassword(userId, currentPassword, newPassword).then(function () {
                loading.hide();
                toast(globalize.translate('PasswordSaved'));

                loadUser().catch(err => {
                    console.error('[UserPasswordForm] failed to load user', err);
                });
            }, function () {
                loading.hide();
                Dashboard.alert({
                    title: globalize.translate('HeaderLoginFailure'),
                    message: globalize.translate('MessageInvalidUser')
                });
            });
        };

        const resetPassword = () => {
            if (!userId) {
                console.error('[UserPasswordForm.resetPassword] missing user id');
                return;
            }

            const msg = globalize.translate('PasswordResetConfirmation');
            confirm(msg, globalize.translate('ResetPassword')).then(function () {
                loading.show();
                window.ApiClient.resetUserPassword(userId).then(function () {
                    loading.hide();
                    Dashboard.alert({
                        message: globalize.translate('PasswordResetComplete'),
                        title: globalize.translate('ResetPassword')
                    });
                    loadUser().catch(err => {
                        console.error('[UserPasswordForm] failed to load user', err);
                    });
                }).catch(err => {
                    console.error('[UserPasswordForm] failed to reset user password', err);
                });
            }).catch(() => {
                // confirm dialog was closed
            });
        };

        const togglePassword = () => {
            const inputIds = ['#txtCurrentPassword', '#txtNewPassword', '#txtNewPasswordConfirm'];
            inputIds.forEach(id => {
                const input = page.querySelector(id) as HTMLInputElement;
                if (input) {
                    input.type = (input.type === 'password') ? 'text' : 'password';
                }
            });
            page.querySelectorAll('.passwordToggle .material-icons').forEach(icon => {
                if (icon.classList.contains('visibility')) {
                    icon.classList.remove('visibility');
                    icon.classList.add('visibility_off');
                } else {
                    icon.classList.remove('visibility_off');
                    icon.classList.add('visibility');
                }
            });
        };

        (page.querySelector('.updatePasswordForm') as HTMLFormElement).addEventListener('submit', onSubmit);
        (page.querySelector('#btnResetPassword') as HTMLButtonElement).addEventListener('click', resetPassword);
        page.querySelectorAll('.passwordToggle').forEach(button => {
            button.addEventListener('click', togglePassword);
        });
    }, [loadUser, userId]);

    return (
        <div ref={element}>
            <form
                className='updatePasswordForm passwordSection hide'
                style={{ margin: '0 auto 2em' }}
            >
                <div className='detailSection'>
                    <div id='fldCurrentPassword' className='inputContainer hide'>
                        <InputElement
                            type='password'
                            id='txtCurrentPassword'
                            label='LabelCurrentPassword'
                            options={'autoComplete="off"'}
                        />
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='passwordToggle'
                            icon='visibility'
                        />
                    </div>
                    <div className='inputContainer'>
                        <InputElement
                            type='password'
                            id='txtNewPassword'
                            label='LabelNewPassword'
                            options={'autoComplete="off"'}
                        />
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='passwordToggle'
                            icon='visibility'
                        />
                    </div>
                    <div className='inputContainer'>
                        <InputElement
                            type='password'
                            id='txtNewPasswordConfirm'
                            label='LabelNewPasswordConfirm'
                            options={'autoComplete="off"'}
                        />
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='passwordToggle'
                            icon='visibility'
                        />
                    </div>
                    <br />
                    <div>
                        <ButtonElement
                            type='submit'
                            className='raised button-submit block'
                            title='SavePassword'
                        />
                        <ButtonElement
                            type='button'
                            id='btnResetPassword'
                            className='raised button-cancel block hide'
                            title='ResetPassword'
                        />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UserPasswordForm;
