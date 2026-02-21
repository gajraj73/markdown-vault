import MermaidDiagram from '../components/MermaidDiagram';

export function getMarkdownComponents(isDark) {
  return {
    code({ className, children, ...props }) {
      const isMermaid = className?.includes('language-mermaid');
      if (isMermaid) {
        return <MermaidDiagram code={String(children).trim()} isDark={isDark} />;
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };
}
