"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { subscribePushAction, unsubscribePushAction } from "@/lib/actions/push";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    if (!ok) {
      setLoading(false);
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) =>
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
          setLoading(false);
        }),
      )
      .catch(() => setLoading(false));
  }, []);

  async function handleSubscribe() {
    if (!supported) {
      toast.error("Tu navegador no soporta notificaciones push");
      return;
    }
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permiso denegado. Habilita las notificaciones en tu navegador.");
        setLoading(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.error("VAPID key no configurada. Ver docs/PUSH-NOTIFICATIONS.md");
        setLoading(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
      });
      const subJson = sub.toJSON();
      const endpoint = subJson.endpoint;
      const keys = subJson.keys as { p256dh: string; auth: string };
      startTransition(async () => {
        const r = await subscribePushAction({ endpoint, keys });
        if (r.ok) {
          setSubscribed(true);
          toast.success(r.message ?? "Notificaciones activadas");
        } else {
          toast.error(r.error ?? "Error");
        }
        setLoading(false);
      });
    } catch (e) {
      console.error("subscribe error", e);
      toast.error("Error al activar notificaciones");
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        startTransition(async () => {
          const r = await unsubscribePushAction(endpoint);
          if (r.ok) {
            setSubscribed(false);
            toast.success("Notificaciones desactivadas");
          } else {
            toast.error(r.error ?? "Error");
          }
          setLoading(false);
        });
      } else {
        setSubscribed(false);
        setLoading(false);
      }
    } catch (e) {
      console.error("unsubscribe error", e);
      toast.error("Error al desactivar");
      setLoading(false);
    }
  }

  if (!supported) return null;

  const icon = loading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : subscribed ? (
    <Bell className="h-4 w-4 text-alebrijes-orange" />
  ) : (
    <BellOff className="h-4 w-4" />
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            onClick={subscribed ? handleUnsubscribe : handleSubscribe}
            disabled={pending || loading}
            aria-label={subscribed ? "Desactivar notificaciones" : "Activar notificaciones"}
          >
            {icon}
          </Button>
        }
      />
      <TooltipContent>
        {subscribed ? "Notificaciones activadas" : "Activar notificaciones"}
      </TooltipContent>
    </Tooltip>
  );
}
