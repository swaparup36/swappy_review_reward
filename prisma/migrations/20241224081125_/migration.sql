-- CreateTable
CREATE TABLE "loginChallenges" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loginChallenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrationChallenges" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registrationChallenges_pkey" PRIMARY KEY ("id")
);
