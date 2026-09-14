import { useState, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import "./FormField.css";

type CommonProps = { id: string; label: string; error?: string };
type FormFieldProps = CommonProps & (
  | ({ options?: never } & InputHTMLAttributes<HTMLInputElement>)
  | ({ options: { value: string; label: string }[] } & SelectHTMLAttributes<HTMLSelectElement>)
);

function FormField({ id, label, error, ...props }: FormFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const errorId = `${id}-error`;
  const accessibilityProps = {
    "aria-invalid": error ? true : props["aria-invalid"],
    "aria-describedby": [props["aria-describedby"], error ? errorId : undefined]
      .filter(Boolean).join(" ") || undefined,
  };

  return (
    <div
      className={`form-field${error ? " form-field--invalid" : ""}`}
    >
      <label htmlFor={id}>{label}</label>
      {props.options ? (
        <div className="form-field__select">
          {(() => {
            const { options, ...selectProps } = props;
            return (
              <select {...selectProps} {...accessibilityProps} id={id}>
                <option value="" disabled>Selecionar</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            );
          })()}
        </div>
      ) : (
        props.type === "password" ? (
          <div className="form-field__password">
            <input
              {...props}
              {...accessibilityProps}
              id={id}
              type={passwordVisible ? "text" : "password"}
            />
            <button
              type="button"
              className="form-field__password-toggle"
              aria-label={`${passwordVisible ? "Ocultar" : "Mostrar"} senha: ${label}`}
              aria-controls={id}
              disabled={props.disabled}
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {passwordVisible && <path d="m3 3 18 18" />}
              </svg>
            </button>
          </div>
        ) : (
          <input {...props} {...accessibilityProps} id={id} />
        )
      )}
      {error && (
        <p className="form-field__error" id={errorId} role="alert">
          <span className="form-field__error-icon" aria-hidden="true">!</span>
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;