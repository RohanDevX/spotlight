CREATE TABLE public.community (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          varchar(500)      NOT NULL,
  category      varchar(100)      NOT NULL,
  sub_category  text              NOT NULL,
  description   varchar(1000)     NOT NULL,
  contact       varchar(100)      NOT NULL,
  email         varchar(255)      NOT NULL,
  address       text              NOT NULL,
  in_charge     text              NOT NULL,
  social_links  json              NOT NULL,   -- e.g. {"instagram":"...", "website":"..."}
  logo          varchar(255),                 -- optional
  image         varchar(255),                 -- optional
  created_at    timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX community_category_idx     ON public.community (category);
CREATE INDEX community_created_at_idx   ON public.community (created_at DESC);



CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- needed for gen_random_uuid()

CREATE TABLE IF NOT EXISTS public.events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name varchar(255) NOT NULL,
    event_date date NOT NULL,
    event_time time NOT NULL,
    cost varchar(50) NOT NULL,
    event_image varchar(255) NOT NULL,
    location varchar(255) NOT NULL,
    contact jsonb NOT NULL, -- e.g. {"phone": "...", "whatsapp": "..."}
    category varchar(100) NOT NULL, -- e.g. Wellness, Sports
    sub_category varchar(100) NOT NULL, -- e.g. Art & Hobbies, Cycling
    social_links jsonb, -- e.g. {"instagram": "...", "website": "..."}
    status varchar(20) NOT NULL DEFAULT 'upcoming', -- 'upcoming', 'completed', 'cancelled'
    created_at timestamptz NOT NULL DEFAULT now(),
    priority boolean NOT NULL DEFAULT false
);



CREATE TABLE IF NOT EXISTS public.users (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       varchar(255)     NOT NULL,
    email      varchar(255)     NOT NULL UNIQUE,
    phone      varchar(20),
    interest   text[],                  
    image      varchar(255),
    password   varchar(255)     NOT NULL,
    created_at timestamptz      NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);


CREATE TABLE public.refresh_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash  text        NOT NULL,          -- store a hashed token, never the raw token
  user_id     uuid        NOT NULL,          -- who owns it
  expires_at  timestamptz NOT NULL,          -- when this token dies
  created_at  timestamptz NOT NULL DEFAULT now(),
  revoked     boolean     NOT NULL DEFAULT false
);

-- Link to users table (adjust schema/table name if needed)
ALTER TABLE public.refresh_tokens
  ADD CONSTRAINT refresh_tokens_user_fk
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Speed lookups & enforce uniqueness if desired
CREATE UNIQUE INDEX refresh_tokens_token_hash_uidx ON public.refresh_tokens (token_hash);
CREATE INDEX refresh_tokens_user_id_idx            ON public.refresh_tokens (user_id);
CREATE INDEX refresh_tokens_expires_at_idx         ON public.refresh_tokens (expires_at);
