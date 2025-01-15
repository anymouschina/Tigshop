<?php

namespace app\service\admin\common\email;

use app\job\EmailJob;
use exceptions\ApiException;
use think\facade\Cache;
use utils\TigQueue;
use utils\Util;

class EmailService
{
	/**
	 * 邮箱验证码过期时间
	 *
	 * @var integer
	 */
	private int $expireTime = 120;

	/**
	 * 发送email
	 * @param string $mobile
	 * @param string $type
	 * @param string $content
	 * @return bool
	 * @throws ApiException
	 */
	public function sendEmail(string $email, string $type, string $code): bool
	{
		if (empty($email)) {
			throw new ApiException(Util::lang('邮箱不能为空'));
		}

		// 获取模板
		$send_info = $this->getTemplate($email,$code,$type);

		// 发送邮件
		app(TigQueue::class)->push(EmailJob::class, $send_info);
		return true;
	}

	/**
	 * 发送邮箱验证码
	 *
	 * @param string $mobile
	 * @param string $event 事件默认login事件
	 * @return bool
	 */
	public function sendEmailCode(string $email, string $event = 'login'): bool
	{
		return $this->sendEmail($email, 'code', $this->creatCode($email,$event));
	}

	/**
	 * 生成验证码
	 *
	 * @param string $email
	 * @param string $event 事件默认login事件
	 * @return string
	 */
	public function creatCode(string $email, string $event = 'login'): string
	{
		$code = rand(100000, 999999);
		Cache::set($event . 'emailCode:' . $email, $code, $this->expireTime);
		return $code;
	}

	/**
	 * 验证邮箱验证码
	 *
	 * @param string $email
	 * @param string $code
	 * @param string $event 事件默认login事件
	 * @return boolean
	 */
	public function checkCode(string $email, string $code, string $event = 'login'): bool
	{
		return Cache::get($event . 'emailCode:' . $email) === $code;
	}

	/**
	 * 获取邮箱验证的模板
	 * @param string $type
	 * @param array $params
	 * @return array
	 */
	public function getTemplate(string $email,string $code,string $type = 'code'): array
	{
		switch ($type) {
			case "code":
				$content = Util::lang("您的验证码是：%s,如果不是本人操作，请忽略本邮件",'',[$code]);
				$send_info = [
					'name' => '',
					'email' => $email,
					'subject' => Util::lang('验证邮件'),
					'content' => $content,
					'type' => 0,
				];
				break;
		}
		return $send_info;
	}
}