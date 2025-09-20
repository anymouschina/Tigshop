// Duplicate of nested module at src/user/feedback/*; disabled to avoid duplicate routes and compile issues.
export {};
  @Post('auto-reply')
  @ApiOperation({ summary: '设置自动回复' })
  @ApiResponse({ status: 200, description: '设置成功' })
  async setAutoReply(@Body() autoReply: {
    feedback_type: string;
    reply_content: string;
    is_enabled: boolean;
  }) {
    const result = await this.userFeedbackService.setAutoReply(autoReply);
    return {
      code: 200,
      message: '设置成功',
      data: result,
    };
  }

  @Get('auto-reply')
  @ApiOperation({ summary: '获取自动回复设置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAutoReply() {
    const autoReply = await this.userFeedbackService.getAutoReply();
    return {
      code: 200,
      message: '获取成功',
      data: autoReply,
    };
  }
}
