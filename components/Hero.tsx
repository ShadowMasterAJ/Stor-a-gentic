"use client";

import { Building2, Clock, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    name: "24/7 Access",
    description: "Access your storage unit whenever you need it, day or night.",
    icon: Clock,
  },
  {
    name: "Multiple Locations",
    description: "Conveniently located storage facilities across the city.",
    icon: MapPin,
  },
  {
    name: "Secure Facilities",
    description: "State-of-the-art security systems and monitoring.",
    icon: Building2,
  },
  {
    name: "Free Collection",
    description: "We'll collect your items and deliver them to storage.",
    icon: Truck,
  },
];

export default function Hero() {
  return (
    <div className="relative overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1600585152220-90363fe7e115?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1
        }}
      />
      
      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl">
            Stor-a-gentic
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Smart storage solutions for every need. Get instant answers, book services, and manage your storage - all in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg">
              Find Storage
            </Button>
            <Button variant="outline" size="lg">
              View Prices
            </Button>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="flex flex-col items-center text-center bg-card p-6 rounded-lg shadow-lg"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-6 text-base font-semibold text-foreground">{feature.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}