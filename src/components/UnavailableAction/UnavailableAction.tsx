import { useId } from "react";
import Button, { type ButtonProps } from "../Button/Button";
import "./UnavailableAction.css";

export default function UnavailableAction({ reason, children, ...props }: Omit<ButtonProps,"onClick" | "disabled"> & { reason: string }) {
  const id = useId();
  return <span className="unavailable-action">
    <Button {...props} aria-disabled="true" aria-describedby={id} onClick={event=>event.preventDefault()}>{children}</Button>
    <span className="unavailable-action__tip" id={id} role="tooltip">{reason}</span>
  </span>;
}
