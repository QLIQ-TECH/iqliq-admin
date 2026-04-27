import type { ReactNode } from "react";


type PageTitleProps = {
  children: ReactNode;
};

export default function PageTitle({ children }: PageTitleProps) {
  return (
    <div className="space-y-2 text-center sm:text-left">
      <h1 className="font-semibold text-2xl sm:text-3xl lg:text-4xl">
        {children}
      </h1>
    </div>
  );
}
