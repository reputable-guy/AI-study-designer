import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-100">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-sm text-neutral-500">© {new Date().getFullYear()} Reputable. All rights reserved.</p>
          </div>
          <div>
            <div className="flex space-x-4">
              <Link href="#privacy">
                <a className="text-sm text-neutral-500 hover:text-primary">Privacy Policy</a>
              </Link>
              <Link href="#terms">
                <a className="text-sm text-neutral-500 hover:text-primary">Terms of Service</a>
              </Link>
              <Link href="#support">
                <a className="text-sm text-neutral-500 hover:text-primary">Contact Support</a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
