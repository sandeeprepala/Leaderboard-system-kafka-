const { z } = require('zod');
const scoreService = require('../services/scoreService');

const scoreSchema = z.object({
  score: z.number().int().nonnegative()
});

const pointsSchema = z.object({
  points: z.number().int().positive()
});

async function handleUpdateScore(req, res, next) {
  try {
    // Extracted from req.user set by verifyToken middleware
    const userId = req.user?.id;
    const region = req.user?.region;
    
    if (!userId || !region) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing user identification or region profile'
      });
    }

    const validatedBody = scoreSchema.parse(req.body);

    const scoreData = await scoreService.upsertScore({
      userId,
      region,
      score: validatedBody.score
    });

    return res.status(200).json({
      success: true,
      message: 'Score updated successfully',
      data: scoreData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      });
    }
    next(error);
  }
}

async function handleIncrementScore(req, res, next) {
  try {
    const userId = req.user?.id;
    const region = req.user?.region;
    
    if (!userId || !region) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing user identification or region profile'
      });
    }

    const validatedBody = pointsSchema.parse(req.body);

    const scoreData = await scoreService.incrementScore({
      userId,
      region,
      points: validatedBody.points
    });

    return res.status(200).json({
      success: true,
      message: 'Score incremented successfully',
      data: scoreData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      });
    }
    next(error);
  }
}

async function handleDecrementScore(req, res, next) {
  try {
    const userId = req.user?.id;
    const region = req.user?.region;
    
    if (!userId || !region) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing user identification or region profile'
      });
    }

    const validatedBody = pointsSchema.parse(req.body);

    const scoreData = await scoreService.decrementScore({
      userId,
      region,
      points: validatedBody.points
    });

    return res.status(200).json({
      success: true,
      message: 'Score decremented successfully',
      data: scoreData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      });
    }
    next(error);
  }
}

module.exports = {
  handleUpdateScore,
  handleIncrementScore,
  handleDecrementScore
};
