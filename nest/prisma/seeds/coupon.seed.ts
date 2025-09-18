import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const coupons = [
    {
      couponName: 'Save 10 Coupon',
      couponCode: 'SAVE10',
      discountAmount: 10.0,
      startTime: '2023-01-01 10:00:00',
      endTime: '2023-12-31 23:59:59',
      totalNum: 100,
    },
    {
      couponName: 'Discount 20 Coupon',
      couponCode: 'DISCOUNT20',
      discountAmount: 20.0,
      startTime: '2023-01-05 12:00:00',
      endTime: '2023-11-30 23:59:59',
      totalNum: 100,
    },
    {
      couponName: 'Welcome 15 Coupon',
      couponCode: 'WELCOME15',
      discountAmount: 15.0,
      startTime: '2023-01-10 15:00:00',
      endTime: '2023-10-31 23:59:59',
      totalNum: 100,
    },
    {
      couponName: 'Holiday 30 Coupon',
      couponCode: 'HOLIDAY30',
      discountAmount: 30.0,
      startTime: '2023-02-01 09:00:00',
      endTime: '2023-12-25 23:59:59',
      totalNum: 100,
    },
    {
      couponName: 'Spring 5 Coupon',
      couponCode: 'SPRING5',
      discountAmount: 5.0,
      startTime: '2023-02-15 11:00:00',
      endTime: '2024-03-01 23:59:59',
      totalNum: 100,
    },
    {
      couponName: 'Summer 25 Coupon',
      couponCode: 'SUMMER25',
      discountAmount: 25.0,
      startTime: '2024-03-01 14:00:00',
      endTime: '2024-09-01 23:59:59',
      totalNum: 100,
    },
    {
      couponName: 'Fall 10 Coupon',
      couponCode: 'FALL10',
      discountAmount: 10.0,
      startTime: '2024-03-15 16:00:00',
      endTime: '2024-11-01 23:59:59',
      totalNum: 100,
    },
    {
      couponName: 'Winter 50 Coupon',
      couponCode: 'WINTER50',
      discountAmount: 50.0,
      startTime: '2024-04-01 18:00:00',
      endTime: '2025-01-01 23:59:59',
      totalNum: 100,
    },
    {
      couponName: 'Black Friday 40 Coupon',
      couponCode: 'BLACKFRIDAY40',
      discountAmount: 40.0,
      startTime: '2024-04-15 19:00:00',
      endTime: '2024-11-29 23:59:59',
      totalNum: 100,
    },
    {
      couponName: 'Cyber Monday 35 Coupon',
      couponCode: 'CYBERMONDAY35',
      discountAmount: 35.0,
      startTime: '2024-05-01 20:00:00',
      endTime: '2024-12-02 23:59:59',
      totalNum: 100,
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.create({
      data: {
        couponName: coupon.couponName,
        couponType: 1,
        couponCode: coupon.couponCode,
        discountAmount: coupon.discountAmount,
        startTime: new Date(coupon.startTime),
        endTime: new Date(coupon.endTime),
        totalNum: coupon.totalNum,
        usedNum: 0,
        isEnable: true,
      },
    });
  }
}

export async function run() {
  await main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
