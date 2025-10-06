"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type BundledLanguage = 
  | "bash"
  | "python"
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "json"
  | "txt"
  | "html"
  | "css"
  | "markdown";

interface CodeBlockContextValue {
  currentValue: string;
  setCurrentValue: (value: string) => void;
}

const CodeBlockContext = React.createContext<CodeBlockContextValue | undefined>(
  undefined
);

function useCodeBlock() {
  const context = React.useContext(CodeBlockContext);
  if (!context) {
    throw new Error("useCodeBlock must be used within a CodeBlock");
  }
  return context;
}

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Array<{ language: string; filename?: string; code: string }>;
  defaultValue: string;
}

const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  ({ className, data, defaultValue, children, ...props }, ref) => {
    const [currentValue, setCurrentValue] = React.useState(defaultValue);

    return (
      <CodeBlockContext.Provider value={{ currentValue, setCurrentValue }}>
        <div
          ref={ref}
          className={cn("overflow-hidden rounded-lg border bg-zinc-950", className)}
          {...props}
        >
          {children}
        </div>
      </CodeBlockContext.Provider>
    );
  }
);
CodeBlock.displayName = "CodeBlock";

const CodeBlockBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    children: (item: { language: string; filename?: string; code: string }) => React.ReactNode;
  }
>(({ className, children, ...props }, ref) => {
  const { currentValue } = useCodeBlock();
  
  return (
    <div ref={ref} className={cn("", className)} {...props}>
      {children}
    </div>
  );
});
CodeBlockBody.displayName = "CodeBlockBody";

interface CodeBlockItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const CodeBlockItem = React.forwardRef<HTMLDivElement, CodeBlockItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { currentValue } = useCodeBlock();
    
    if (value !== currentValue) return null;
    
    return (
      <div ref={ref} className={cn("", className)} {...props}>
        {children}
      </div>
    );
  }
);
CodeBlockItem.displayName = "CodeBlockItem";

interface CodeBlockContentProps extends React.HTMLAttributes<HTMLPreElement> {
  language: BundledLanguage;
  syntaxHighlighting?: boolean;
  children: string;
}

const CodeBlockContent = React.forwardRef<HTMLPreElement, CodeBlockContentProps>(
  ({ className, language, syntaxHighlighting = true, children, ...props }, ref) => {
    return (
      <pre
        ref={ref}
        className={cn(
          "overflow-x-auto p-4 text-sm",
          "bg-zinc-950 text-zinc-50",
          className
        )}
        {...props}
      >
        <code className={`language-${language}`}>{children}</code>
      </pre>
    );
  }
);
CodeBlockContent.displayName = "CodeBlockContent";

export { CodeBlock, CodeBlockBody, CodeBlockItem, CodeBlockContent };
