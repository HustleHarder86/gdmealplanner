import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
}

export default function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  const baseStyles = "bg-white rounded-lg";

  const variants = {
    default: "shadow-sm",
    bordered: "border border-neutral-200",
    elevated: "shadow-md hover:shadow-lg transition-shadow",
  };

  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({
  children,
  className = "",
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-xl font-semibold text-neutral-900 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-neutral-600 mt-1 ${className}`}>{children}</p>
  );
}

export function CardContent({
  children,
  className = "",
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mt-6 ${className}`}>{children}</div>;
}
