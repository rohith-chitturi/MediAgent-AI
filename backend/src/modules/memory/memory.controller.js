const prisma = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Enterprise Agent Memory Controller
 */

// GET /api/memory (List memories paginated & filtered)
const listMemories = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;
    const { limit = 20, page = 1, memoryCategory, agentName, patientId, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      hospitalId,
      ...(memoryCategory ? { memoryCategory } : {}),
      ...(agentName ? { agentName } : {}),
      ...(patientId ? { patientId } : {}),
      ...(search ? {
        OR: [
          { summary: { contains: search, mode: 'insensitive' } },
          { agentName: { contains: search, mode: 'insensitive' } },
          { memoryCategory: { contains: search, mode: 'insensitive' } }
        ]
      } : {})
    };

    const [memories, total] = await Promise.all([
      prisma.agentMemory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.agentMemory.count({ where })
    ]);

    res.json({
      success: true,
      data: { data: memories, total, page: parseInt(page) }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/memory/analytics (Analytics Dashboard Metrics)
const getMemoryAnalytics = async (req, res, next) => {
  try {
    const hospitalId = req.user.hospitalId;

    const [totalMemories, categoriesGroup, topRetrieved, agentUsage] = await Promise.all([
      prisma.agentMemory.count({ where: { hospitalId } }),

      prisma.agentMemory.groupBy({
        by: ['memoryCategory'],
        where: { hospitalId },
        _count: { _all: true }
      }),

      prisma.agentMemory.findMany({
        where: { hospitalId },
        orderBy: { retrievalCount: 'desc' },
        take: 5
      }),

      prisma.agentMemory.groupBy({
        by: ['agentName'],
        where: { hospitalId },
        _count: { _all: true }
      })
    ]);

    const categoryBreakdown = {};
    categoriesGroup.forEach(c => {
      categoryBreakdown[c.memoryCategory] = c._count._all;
    });

    const agentBreakdown = {};
    agentUsage.forEach(a => {
      agentBreakdown[a.agentName] = a._count._all;
    });

    res.json({
      success: true,
      data: {
        totalMemories,
        categoryBreakdown,
        agentBreakdown,
        mostInfluentialMemories: topRetrieved
      }
    });
  } catch (err) {
    next(err);
  }
};

// Internal API: POST /api/internal/agent-memory (Create Memory from Python)
const createMemoryInternal = async (req, res, next) => {
  try {
    const {
      hospitalId,
      patientId,
      agentName,
      memoryCategory,
      sourceWorkflow,
      summary,
      metadata = {},
      vectorData = [],
      importanceScore = 0.5,
      confidence = 0.9
    } = req.body;

    const memory = await prisma.agentMemory.create({
      data: {
        hospitalId,
        patientId,
        agentName,
        memoryCategory,
        sourceWorkflow,
        summary,
        metadata,
        vectorData,
        importanceScore,
        confidence
      }
    });

    res.json({ success: true, data: memory });
  } catch (err) {
    next(err);
  }
};

// Internal API: POST /api/internal/agent-memory/query (Raw query fetch for Python vector similarity matching)
const queryMemoriesInternal = async (req, res, next) => {
  try {
    const { hospitalId, patientId, memoryCategory, limit = 50 } = req.body;

    const where = {
      hospitalId,
      ...(patientId ? { patientId } : {}),
      ...(memoryCategory ? { memoryCategory } : {})
    };

    const memories = await prisma.agentMemory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    res.json({ success: true, data: memories });
  } catch (err) {
    next(err);
  }
};

// Internal API: POST /api/internal/agent-memory/:id/touch (Update retrieval statistics)
const touchMemoryInternal = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.agentMemory.update({
      where: { id },
      data: {
        retrievalCount: { increment: 1 },
        lastRetrievedAt: new Date()
      }
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listMemories,
  getMemoryAnalytics,
  createMemoryInternal,
  queryMemoriesInternal,
  touchMemoryInternal
};
