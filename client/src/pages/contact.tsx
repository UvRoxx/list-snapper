import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Instagram, Facebook } from "lucide-react";

export default function Contact() {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      description: "Send us an email and we'll get back to you",
      link: "mailto:support@snaplist.com",
      label: "support@snaplist.com",
      color: "text-purple-500"
    },
    {
      icon: Instagram,
      title: "Instagram",
      description: "Follow us and send a DM",
      link: "https://instagram.com/snaplist",
      label: "@snaplist",
      color: "text-pink-500"
    },
    {
      icon: Facebook,
      title: "Facebook",
      description: "Like our page and send us a message",
      link: "https://facebook.com/snaplist",
      label: "SnapList",
      color: "text-blue-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions or need support? We're here to help! Choose your preferred way to reach us.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${method.color}`} />
                  </div>
                  <CardTitle className="text-xl">{method.title}</CardTitle>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href={method.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {method.label}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-purple-50 to-pink-50 border-none">
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
              <CardDescription>
                We typically respond within 24-48 hours during business days.
                For urgent issues, please mention "URGENT" in your message subject.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">General Inquiries</h4>
                    <p className="text-sm text-muted-foreground">
                      Questions about our services, pricing, or features
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-pink-600 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Technical Support</h4>
                    <p className="text-sm text-muted-foreground">
                      Issues with your account, QR codes, or orders
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
