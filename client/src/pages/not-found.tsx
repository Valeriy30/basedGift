import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="pt-6 text-center space-y-6 p-8">
          <div className="flex justify-center">
            <div className="bg-red-100 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold text-gray-900">Page Not Found</h1>
            <p className="text-gray-500">
              Oops! The gift you are looking for might have been moved or doesn't exist.
            </p>
          </div>

          <Link href="/">
            <Button className="w-full h-12 rounded-xl text-lg gap-2 shadow-md">
              <ArrowLeft className="h-5 w-5" />
              Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
