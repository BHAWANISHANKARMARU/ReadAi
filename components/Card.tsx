import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`card card-app shadow ${className}`}>
      <div className="card-body">
      {children}
      </div>
    </div>
  );
};

export default Card;
