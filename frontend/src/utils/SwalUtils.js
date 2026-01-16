import Swal from 'sweetalert2';

const themeColors = {
    primary: '#00e676',
    danger: '#d33',
    background: '#1a1a1a',
    text: '#fff'
};

const commonConfig = {
    background: themeColors.background,
    color: themeColors.text,
    confirmButtonColor: themeColors.primary,
    cancelButtonColor: themeColors.danger,
};

export const showSuccess = (title, message) => {
    return Swal.fire({
        ...commonConfig,
        title: title,
        html: message, // Allow HTML for styled messages
        icon: 'success'
    });
};

export const showError = (title, message) => {
    return Swal.fire({
        ...commonConfig,
        title: title,
        text: message,
        icon: 'error'
    });
};

export const showWarning = (title, message) => {
    return Swal.fire({
        ...commonConfig,
        title: title,
        text: message,
        icon: 'warning'
    });
};

export const showConfirm = (title, message, confirmText = 'Yes, Proceed!') => {
    return Swal.fire({
        ...commonConfig,
        title: title,
        html: message,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancel'
    });
};

export const showInput = async (title, message, placeholder = '') => {
    const result = await Swal.fire({
        ...commonConfig,
        title: title,
        text: message,
        input: 'text',
        inputPlaceholder: placeholder,
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) {
                return 'You need to write something!';
            }
        }
    });
    return result; // result.value contains the input
};

export const showToast = (title, icon = 'success') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: themeColors.background,
        color: themeColors.text,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: icon,
        title: title
    });
};
