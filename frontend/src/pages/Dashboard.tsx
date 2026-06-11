import axios from "axios";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { use, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "@/lib/config";

const supabase = createClient();

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getInfo() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    }

    getInfo();
  }, []);

  useEffect(() => {
    async function getExistingConversation() {
      if (user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const jwt = session?.access_token;
        axios.post(`${BACKEND_URL}`);
      }
    }
  }, [user]);

  return (
    <div>
      {!user ? (
        <Button
          onClick={() => {
            navigate("/auth");
          }}
        >
          Sign In
        </Button>
      ) : (
        <span>{user.email}</span>
      )}
      {user && (
        <div>
          <Button
            onClick={() => {
              {
                supabase.auth.signOut();
              }
              setUser(null);
            }}
          >
            Logout
          </Button>
        </div>
      )}
    </div>
  );
}
