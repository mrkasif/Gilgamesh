"use client";

import { Check, Copy } from "lucide-react";
import {
  Children,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

function InlineCode({ children }: { children?: ReactNode }) {
  return (
    <code className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[0.85em] text-foreground ring-1 ring-inset ring-edge-strong">
      {children}
    </code>
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 overflow-hidden rounded-xl border border-edge bg-panel">
      <div className="flex items-center justify-between gap-3 border-b border-edge bg-surface px-3.5 py-1.5">
        <span className="min-w-0 truncate font-mono text-[10.5px] font-medium tracking-wide text-faint uppercase">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-faint transition-colors duration-150 hover:bg-surface-2 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          {copied ? (
            <Check className="h-3 w-3 text-accent" aria-hidden />
          ) : (
            <Copy className="h-3 w-3" aria-hidden />
          )}
          <span className={copied ? "text-accent" : undefined}>
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 text-[13px] leading-6 text-foreground">
        <code className="font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

export function MarkdownContent({ content }: { content: string }) {
  const components: Components = {
    p({ children }) {
      return <p className="my-2.5 leading-[1.75]">{children}</p>;
    },
    h1({ children }) {
      return (
        <h1 className="mt-5 mb-2.5 text-lg leading-7 font-semibold tracking-tight text-foreground first:mt-0">
          {children}
        </h1>
      );
    },
    h2({ children }) {
      return (
        <h2 className="mt-5 mb-2 text-[17px] leading-7 font-semibold tracking-tight text-foreground first:mt-0">
          {children}
        </h2>
      );
    },
    h3({ children }) {
      return (
        <h3 className="mt-4 mb-1.5 text-[15px] leading-6 font-semibold text-foreground first:mt-0">
          {children}
        </h3>
      );
    },
    h4({ children }) {
      return (
        <h4 className="mt-4 mb-1.5 text-[14px] leading-6 font-semibold text-foreground first:mt-0">
          {children}
        </h4>
      );
    },
    strong({ children }) {
      return <strong className="font-semibold text-foreground">{children}</strong>;
    },
    em({ children }) {
      return <em className="italic">{children}</em>;
    },
    ul({ children }) {
      return (
        <ul className="my-2.5 list-disc space-y-1.5 pl-5 marker:text-faint">
          {children}
        </ul>
      );
    },
    ol({ children }) {
      return (
        <ol className="my-2.5 list-decimal space-y-1.5 pl-5 marker:text-faint">
          {children}
        </ol>
      );
    },
    li({ children }) {
      return (
        <li className="leading-7 [&>ol]:my-2 [&>p]:my-0 [&>ul]:my-2">
          {children}
        </li>
      );
    },
    a({ href, children }) {
      const isExternal =
        href?.startsWith("http://") || href?.startsWith("https://");
      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
          className="text-accent underline-offset-2 transition-colors duration-150 hover:text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {children}
        </a>
      );
    },
    blockquote({ children }) {
      return (
        <blockquote className="my-3.5 border-l-2 border-accent/40 py-0.5 pl-4 text-muted italic">
          {children}
        </blockquote>
      );
    },
    hr() {
      return <hr className="my-5 border-edge" />;
    },
    code({ children }) {
      return <InlineCode>{children}</InlineCode>;
    },
    pre({ children }) {
      const child = Children.only(children) as ReactElement<{
        className?: string;
        children?: ReactNode;
      }>;
      const className =
        typeof child.props.className === "string" ? child.props.className : "";
      const lang = /language-([\w-]+)/.exec(className)?.[1];
      const code = String(child.props.children ?? "").replace(/\n$/, "");
      return <CodeBlock code={code} lang={lang} />;
    },
    table({ children }) {
      return (
        <div className="my-3.5 overflow-x-auto rounded-lg border border-edge">
          <table className="w-full min-w-[420px] border-collapse text-[13.5px] leading-6">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }) {
      return (
        <thead className="border-b border-edge-strong bg-surface">{children}</thead>
      );
    },
    th({ children }) {
      return (
        <th className="px-3.5 py-2 text-left align-middle font-semibold text-foreground">
          {children}
        </th>
      );
    },
    td({ children }) {
      return <td className="border-t border-edge px-3.5 py-2 align-top">{children}</td>;
    },
  };

  return (
    <div className="min-w-0 [overflow-wrap:anywhere]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}