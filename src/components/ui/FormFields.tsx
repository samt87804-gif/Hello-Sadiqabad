import React from 'react';

interface FieldWrapperProps {
  label?: string;
  labelUr?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}

export function FieldWrapper({
  label,
  labelUr,
  error,
  hint,
  required,
  htmlFor,
  children,
}: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {(label || labelUr) && (
        <label
          htmlFor={htmlFor}
          className="flex items-center justify-between gap-2 text-xs font-semibold text-on-surface"
        >
          <span>
            {label}
            {required && <span className="text-error ms-0.5">*</span>}
          </span>
          {labelUr && (
            <span className="font-urdu text-[11px] font-medium text-on-surface-variant" dir="rtl">
              {labelUr}
            </span>
          )}
        </label>
      )}
      {children}
      {error && <p className="text-xs font-medium text-error">{error}</p>}
      {!error && hint && <p className="text-xs text-on-surface-variant">{hint}</p>}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelUr?: string;
  error?: string;
  hint?: string;
  leftAdornment?: React.ReactNode;
}

export function Input({
  label,
  labelUr,
  error,
  hint,
  required,
  id,
  leftAdornment,
  className = '',
  ...rest
}: InputProps) {
  const inputId = id ?? (label ? `inp-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);
  return (
    <FieldWrapper label={label} labelUr={labelUr} error={error} hint={hint} required={required} htmlFor={inputId}>
      <div className="relative flex items-center">
        {leftAdornment && (
          <span className="absolute start-3 text-on-surface-variant pointer-events-none flex items-center">
            {leftAdornment}
          </span>
        )}
        <input
          id={inputId}
          required={required}
          className={`w-full min-h-[44px] rounded-xl bg-surface-container-lowest border ${
            error ? 'border-error' : 'border-outline-variant/70 focus:border-primary'
          } px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline transition-colors ${
            leftAdornment ? 'ps-10' : ''
          } ${className}`}
          {...rest}
        />
      </div>
    </FieldWrapper>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelUr?: string;
  error?: string;
  hint?: string;
}

export function Select({
  label,
  labelUr,
  error,
  hint,
  required,
  id,
  className = '',
  children,
  ...rest
}: SelectProps) {
  const selectId = id ?? (label ? `sel-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);
  return (
    <FieldWrapper label={label} labelUr={labelUr} error={error} hint={hint} required={required} htmlFor={selectId}>
      <select
        id={selectId}
        required={required}
        className={`w-full min-h-[44px] rounded-xl bg-surface-container-lowest border ${
          error ? 'border-error' : 'border-outline-variant/70 focus:border-primary'
        } px-3.5 py-2.5 text-sm text-on-surface transition-colors ${className}`}
        {...rest}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelUr?: string;
  error?: string;
  hint?: string;
}

export function Textarea({
  label,
  labelUr,
  error,
  hint,
  required,
  id,
  className = '',
  rows = 3,
  ...rest
}: TextareaProps) {
  const areaId = id ?? (label ? `txt-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);
  return (
    <FieldWrapper label={label} labelUr={labelUr} error={error} hint={hint} required={required} htmlFor={areaId}>
      <textarea
        id={areaId}
        rows={rows}
        required={required}
        className={`w-full rounded-xl bg-surface-container-lowest border ${
          error ? 'border-error' : 'border-outline-variant/70 focus:border-primary'
        } px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline transition-colors ${className}`}
        {...rest}
      />
    </FieldWrapper>
  );
}
