import React, { createContext, useContext, useState } from "react";
import Toast from "../components/ui/toast";

interface ToastOptions {
  message: string;
  actionText?: string;
  onActionPress?: () => void;
  hasTabBar?: boolean;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toastConfig, setToastConfig] = useState<ToastOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = (options: ToastOptions) => {
    setToastConfig(options);
    setVisible(true);
  };

  const hideToast = () => {
    setVisible(false);
    setTimeout(() => {
      setToastConfig(null);
    }, 300);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toastConfig && (
        <Toast
          message={toastConfig.message}
          actionText={toastConfig.actionText}
          onActionPress={toastConfig.onActionPress}
          onClose={hideToast}
          visible={visible}
          hasTabBar={toastConfig.hasTabBar}
        />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
