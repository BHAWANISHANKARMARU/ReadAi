'use client';

import { ReactNode } from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
}

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, children }: ConfirmationDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} tabIndex={-1} role="dialog" aria-labelledby="confirmationModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="confirmationModalLabel">{title}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {children}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
