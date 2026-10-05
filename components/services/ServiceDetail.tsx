"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Smartphone,
  Globe,
  Code2,
  Share2,
  TrendingUp,
  Palette,

} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Footer from "@/components/Footer";
import { Service } from "@/lib/servicesData";

// Map icon names to components
const iconMap: Record<string, LucideIcon> = {
  Smartphone,
  Globe,
  Code2,
  Share2,
  TrendingUp,
  Palette,

};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function ServiceDetail({ service }: { service: Service }) {
  const IconComponent = iconMap[service.iconName] || Globe;

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <Link
          href="/#services"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />{" "}
          Back to Services
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Content */}
          <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              variants={slideUp}
              className={`inline-flex p-4 rounded-2xl bg-linear-to-br ${service.gradient}`}
            >
              <IconComponent size={48} className="text-white" />
            </motion.div>

            <motion.h1
              variants={slideUp}
              className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400"
            >
              {service.title}
            </motion.h1>

            <motion.p
              variants={slideUp}
              className="text-xl text-gray-300 leading-relaxed"
            >
              {service.longDescription}
            </motion.p>

            <motion.div
              variants={slideUp}
              className="space-y-6 pt-8 border-t border-white/10"
            >
              <h3 className="text-2xl font-bold text-white">Key Features</h3>
              <ul className="grid sm:grid-cols-2 gap-4">
                {service.features.map((feature, idx) => (
                  <motion.li
                    key={idx}
                    variants={slideUp}
                    className="flex items-center gap-3 text-gray-400"
                  >
                    <div
                      className={`p-1 rounded-full bg-linear-to-br ${service.gradient}`}
                    >
                      <Check size={14} className="text-white" />
                    </div>
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={slideUp} className="pt-8">
              <Link href={`/contact?plan=${encodeURIComponent(service.title)}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-8 py-4 rounded-xl font-bold text-white bg-linear-to-r ${service.gradient} hover:opacity-90 transition-opacity shadow-lg`}
                >
                  Get Started with {service.title}
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column: Benefits/Visuals */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-12 sticky top-24 backdrop-blur-sm"
          >
            <h3 className="text-2xl font-bold text-white mb-8">
              Why Choose Us?
            </h3>
            <div className="space-y-6">
              {service.benefits.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="text-2xl font-bold text-gray-500">
                    0{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {benefit}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Detailed attention to ensuring {benefit.toLowerCase()} for
                      your project.
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
