"use server";

import { revalidatePath } from "next/cache";
import { db } from "../lib/db";

export async function saveProfileAction(fd: FormData) {
  const data = {
    fullName:   (fd.get("fullName")   as string) || null,
    email:      (fd.get("email")      as string) || null,
    location:   (fd.get("location")   as string) || null,
    website:    (fd.get("website")    as string) || null,
    linkedin:   (fd.get("linkedin")   as string) || null,
    skills:     (fd.get("skills")     as string) || null,
    education:  (fd.get("education")  as string) || null,
    experience: (fd.get("experience") as string) || null,
  };

  const existing = await db.userProfile.findFirst();
  if (existing) {
    await db.userProfile.update({ where: { id: existing.id }, data });
  } else {
    await db.userProfile.create({ data });
  }

  revalidatePath("/settings");
}
