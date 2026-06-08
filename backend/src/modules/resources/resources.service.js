const prisma = require('../../config/db');
const { publishEvent } = require('../../events/eventPublisher');
const { EVENTS } = require('../../events/eventTypes');
const { httpError } = require('../../utils/response');

const list = async ({ hospitalId, type, lowStock, skip, limit }) => {
  const where = {
    hospitalId,
    ...(type && { type }),
    ...(lowStock && { quantity: { lte: prisma.resource.fields.threshold } }),
  };

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where, skip, take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.resource.count({ where }),
  ]);

  return {
    resources: resources.map((r) => ({
      ...r,
      stockPercent: Math.round((r.quantity / Math.max(r.threshold * 3, 1)) * 100),
      isLow: r.quantity <= r.threshold,
      isCritical: r.quantity <= Math.floor(r.threshold / 2),
    })),
    total,
  };
};

const getById = async (id, hospitalId) => {
  const resource = await prisma.resource.findFirst({ where: { id, hospitalId } });
  if (!resource) throw httpError('Resource not found.', 404);
  return resource;
};

const create = async (data, hospitalId) =>
  prisma.resource.create({ data: { ...data, hospitalId } });

const update = async (id, hospitalId, data) => {
  await getById(id, hospitalId);
  const resource = await prisma.resource.update({ where: { id }, data });

  if (resource.quantity <= resource.threshold) {
    const eventType = resource.quantity <= Math.floor(resource.threshold / 2)
      ? EVENTS.RESOURCE_CRITICAL
      : EVENTS.RESOURCE_LOW;
    await publishEvent(eventType, hospitalId, {
      resourceId: id, name: resource.name,
      quantity: resource.quantity, threshold: resource.threshold, hospitalId,
    });
  } else {
    await publishEvent(EVENTS.RESOURCE_UPDATED, hospitalId, { resourceId: id, hospitalId });
  }

  return resource;
};

const restock = async (id, hospitalId, quantity, notes) => {
  await getById(id, hospitalId);
  const resource = await prisma.resource.update({
    where: { id },
    data: { quantity: { increment: quantity } },
  });

  await publishEvent(EVENTS.RESOURCE_UPDATED, hospitalId, {
    resourceId: id, restocked: quantity, newQuantity: resource.quantity, hospitalId,
  });

  return resource;
};

const getLowStock = async (hospitalId) => {
  const resources = await prisma.resource.findMany({ where: { hospitalId } });
  return resources.filter((r) => r.quantity <= r.threshold);
};

module.exports = { list, getById, create, update, restock, getLowStock };
