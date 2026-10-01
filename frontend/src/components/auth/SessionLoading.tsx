import Image from 'next/image';

type Props = {
  message?: string;
};

export default function SessionLoading({ message = 'Memulihkan sesi...' }: Props) {
  return (
    <div className="auth-loading" role="status" aria-live="polite">
      <Image src="/edglo-logo.png" alt="EdGLO" width={512} height={512} priority />
      <span>{message}</span>
    </div>
  );
}
