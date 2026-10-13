import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import "./Checkbox.css";
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode };
const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox({ label, id, className = "", ...props }, ref) {
  const generatedId = useId();
  return <label className={`ds-checkbox ${className}`} htmlFor={id || generatedId}>
    <input {...props} ref={ref} id={id || generatedId} type="checkbox" /><span>{label}</span>
  </label>;
});
export default Checkbox;
