-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_RESPONSE', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('ACCOUNT', 'PAYMENT', 'ORDER', 'PRODUCT', 'WITHDRAWAL', 'TECHNICAL', 'OTHER');

-- CreateTable
CREATE TABLE "commissions" (
    "id" SERIAL NOT NULL,
    "startPrice" DECIMAL(15,2) NOT NULL,
    "endPrice" DECIMAL(15,2),
    "commission" DECIMAL(15,2) NOT NULL,
    "level" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "announcements" JSONB[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "ticketId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" "TicketCategory" NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "userName" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "userEmail" TEXT,
    "shopName" TEXT,
    "orderId" TEXT,
    "paymentId" TEXT,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("ticketId")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "messageId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT,
    "content" TEXT NOT NULL,
    "attachments" TEXT[],
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" TEXT,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("messageId")
);

-- CreateIndex
CREATE UNIQUE INDEX "commissions_startPrice_endPrice_level_key" ON "commissions"("startPrice", "endPrice", "level");

-- CreateIndex
CREATE UNIQUE INDEX "announcements_id_key" ON "announcements"("id");

-- CreateIndex
CREATE INDEX "ticketUserIndex" ON "support_tickets"("userId");

-- CreateIndex
CREATE INDEX "ticketStatusIndex" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "ticketPhoneIndex" ON "support_tickets"("userPhone");

-- CreateIndex
CREATE INDEX "messageTicketIndex" ON "ticket_messages"("ticketId");

-- CreateIndex
CREATE INDEX "messageSenderIndex" ON "ticket_messages"("senderId");

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("ticketId") ON DELETE RESTRICT ON UPDATE CASCADE;
