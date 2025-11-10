import React from 'react';
import styles from './global.module.css';

export default function MeetingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      {children}
    </div>
  );
}
