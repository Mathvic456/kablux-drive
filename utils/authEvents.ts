type LogoutListener = () => void;

let listener: LogoutListener | null = null;

export const authEvents = {
    onLogout: (fn: LogoutListener) => {
        listener = fn;
    },
    offLogout: () => {
        listener = null;
    },
    emitLogout: () => {
        listener?.();
    },
};