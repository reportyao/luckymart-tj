import { describe, test, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WithdrawForm from '../WithdrawForm';
// WithdrawForm 组件测试

// 模拟 react-i18next
jest.mock('react-i18next', () => ({}
  useTranslation: () => ({}
    t: (key: string) => {}
      const translations: Record<string, string> = {}
        'wallet:title': '钱包',
        'wallet:withdraw': '提现'
      };
      return translations[key] || key;
    
  })
}));

// 模拟 fetch
global.fetch = jest.fn();

// 测试工具函数
const createMockUser = () => ({}
  id: '1',
  telegramId: '123456789',
  username: 'testuser',
  firstName: '测试用户',
  lastName: '',
  avatarUrl: '',
  language: 'zh-CN',
  coinBalance: 1000,
  platformBalance: 0,
  vipLevel: 1,
  totalSpent: 500,
  freeDailyCount: 3,
  lastFreeResetDate: new Date(),
  referralCode: 'TEST123',
  createdAt: new Date(),
  updatedAt: new Date(),
  balance: 1000
});

describe('WithdrawForm', () => {}
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {}
    mockOnSubmit.mockClear();
    (fetch as jest.Mock).mockClear();
  });

  test('应该正确渲染提现表单', () => {}
    render(
      <WithdrawForm
        balance={1000}
        user={createMockUser()}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('钱包 - 提现')).toBeInTheDocument();
    expect(screen.getByText('可用余额')).toBeInTheDocument();
    expect(screen.getByText('1000.00 TJS')).toBeInTheDocument();
    expect(screen.getByLabelText(/提现金额/)).toBeInTheDocument();
    expect(screen.getByLabelText(/支付密码/)).toBeInTheDocument();
  });

  test('应该验证必填字段', async () => {}
    const user = userEvent.setup();
    render(
      <WithdrawForm
        balance={1000}
        user={createMockUser()}
        onSubmit={mockOnSubmit}
      />
    );

    // 尝试提交空表单
    await user.click(screen.getByRole('button', { name: /提交提现申请/ }));

    await waitFor(() => {}
      expect(screen.getByText(/请输入有效的提现金额/)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('应该验证余额不足', async () => {}
    const user = userEvent.setup();
    render(
      <WithdrawForm
        balance={50}
        user={createMockUser()}
        onSubmit={mockOnSubmit}
      />
    );

    // 输入超过余额的金额
    const amountInput = screen.getByLabelText(/提现金额/);
    await user.clear(amountInput);
    await user.type(amountInput, '100');

    // 输入账户信息
    const accountNameInput = screen.getByLabelText(/收款人姓名/);
    await user.clear(accountNameInput);
    await user.type(accountNameInput, '测试用户');

    const accountNumberInput = screen.getByLabelText(/手机号/);
    await user.clear(accountNumberInput);
    await user.type(accountNumberInput, '+992900000000');

    // 输入密码
    const passwordInput = screen.getByLabelText(/支付密码/);
    await user.clear(passwordInput);
    await user.type(passwordInput, '123456');

    // 勾选协议
    const agreementCheckbox = screen.getByRole('checkbox');
    await user.click(agreementCheckbox);

    // 尝试提交
    await user.click(screen.getByRole('button', { name: /提交提现申请/ }));

    await waitFor(() => {}
      expect(screen.getByText(/余额不足/)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('应该正确计算手续费', () => {}
    render(
      <WithdrawForm
        balance={1000}
        user={createMockUser()}
        onSubmit={mockOnSubmit}
      />
    );

    const amountInput = screen.getByLabelText(/提现金额/);
    fireEvent.change(amountInput, { target: { value: '100' } });

    expect(screen.getByText('手续费: 5.00 TJS (5% 或最低 2 TJS)')).toBeInTheDocument();
    expect(screen.getByText('实际到账: 95.00 TJS')).toBeInTheDocument();
  });

  test('应该正确处理提现方式切换', async () => {}
    const user = userEvent.setup();
    render(
      <WithdrawForm
        balance={1000}
        user={createMockUser()}
        onSubmit={mockOnSubmit}
      />
    );

    // 默认是 Alif Mobi
    expect(screen.getByLabelText(/手机号/)).toBeInTheDocument();

    // 切换到银行卡
    const bankCardTab = screen.getByRole('tab', { name: /银行卡/ });
    await user.click(bankCardTab);

    expect(screen.getByLabelText(/银行卡号/)).toBeInTheDocument();
    expect(screen.getByLabelText(/开户银行/)).toBeInTheDocument();
  });

  test('应该正确提交表单', async () => {}
    const user = userEvent.setup();
    (fetch as jest.Mock).mockResolvedValueOnce({}
      ok: true,
  json: () => true, data: { id: '123' } }): Promise.resolve({ success
    });

    render(
      <WithdrawForm
        balance={1000}
        user={createMockUser()}
        onSubmit={mockOnSubmit}
      />
    );

    // 填写表单
    const amountInput = screen.getByLabelText(/提现金额/);
    await user.clear(amountInput);
    await user.type(amountInput, '100');

    const accountNameInput = screen.getByLabelText(/收款人姓名/);
    await user.clear(accountNameInput);
    await user.type(accountNameInput, '测试用户');

    const accountNumberInput = screen.getByLabelText(/手机号/);
    await user.clear(accountNumberInput);
    await user.type(accountNumberInput, '+992900000000');

    const passwordInput = screen.getByLabelText(/支付密码/);
    await user.clear(passwordInput);
    await user.type(passwordInput, '123456');

    // 勾选协议
    const agreementCheckbox = screen.getByRole('checkbox');
    await user.click(agreementCheckbox);

    // 提交表单
    await user.click(screen.getByRole('button', { name: /提交提现申请/ }));

    await waitFor(() => {}
      expect(mockOnSubmit).toHaveBeenCalledWith({}
        amount: '100',
        method: 'alif_mobi',
        accountInfo: {}
          accountName: '测试用户',
          accountNumber: '+992900000000'
        },
        password: '123456'
      });
    });
  });

  test('应该显示加载状态', async () => {}
    const user = userEvent.setup();
    (fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <WithdrawForm
        balance={1000}
        user={createMockUser()}
        onSubmit={mockOnSubmit}
      />
    );

    // 快速填写表单
    await user.type(screen.getByLabelText(/提现金额/), '100');
    await user.type(screen.getByLabelText(/收款人姓名/), '测试用户');
    await user.type(screen.getByLabelText(/手机号/), '+992900000000');
    await user.type(screen.getByLabelText(/支付密码/), '123456');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /提交提现申请/ }));

    expect(screen.getByText('提交中...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /提交提现申请/ })).toBeDisabled();

    await waitFor(() => {}
      expect(screen.getByText('提交提现申请')).toBeInTheDocument();
    });
  });

  test('应该自定义提现参数', () => {}
    render(
      <WithdrawForm
        balance={2000}
        user={createMockUser()}
        onSubmit={mockOnSubmit}
        minWithdrawAmount={100}
        feeRate={0.03}
        minFee={3}
      />
    );

    const amountInput = screen.getByLabelText(/提现金额/);
    fireEvent.change(amountInput, { target: { value: '100' } });

    // 3% 的手续费，但最低 3 TJS
    expect(screen.getByText('手续费: 3.00 TJS (3% 或最低 3 TJS)')).toBeInTheDocument();
    expect(screen.getByText('实际到账: 97.00 TJS')).toBeInTheDocument();
  });
});