-- CreateTable
CREATE TABLE "user_profiles" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "location" TEXT,
    "website" TEXT,
    "linkedin" TEXT,
    "skills" TEXT,
    "education" TEXT,
    "experience" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);
