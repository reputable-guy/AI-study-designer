import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border py-3">
      <div className="container mx-auto px-4">
        <div className="flex justify-end items-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Reputable Labs Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
