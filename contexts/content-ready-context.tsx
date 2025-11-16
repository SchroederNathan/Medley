import { createContext, PropsWithChildren, useState } from "react";

type ContentReadyState = {
  isContentReady: boolean;
  setContentReady: (ready: boolean) => void;
};

export const ContentReadyContext = createContext<ContentReadyState>({
  isContentReady: false,
  setContentReady: () => {},
});

export const ContentReadyProvider = ({ children }: PropsWithChildren) => {
  const [isContentReady, setIsContentReady] = useState(false);

  return (
    <ContentReadyContext.Provider
      value={{
        isContentReady,
        setContentReady: setIsContentReady,
      }}
    >
      {children}
    </ContentReadyContext.Provider>
  );
};
