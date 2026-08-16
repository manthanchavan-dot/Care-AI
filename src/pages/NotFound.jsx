import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center">
      <h1 className="font-display text-4xl font-bold text-slate-800">404</h1>
      <p className="text-muted-foreground">This page doesn't exist.</p>
      <Link to="/">
        <Button variant="outline">Back home</Button>
      </Link>
    </div>
  );
}
