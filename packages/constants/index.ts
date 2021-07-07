import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000')

export const BIG_DECIMAL_1E6 = BigDecimal.fromString('1e6')

export const BIG_DECIMAL_1E12 = BigDecimal.fromString('1e12')

export const BIG_DECIMAL_1E18 = BigDecimal.fromString('1e18')

export const BIG_DECIMAL_ZERO = BigDecimal.fromString('0')

export const BIG_DECIMAL_ONE = BigDecimal.fromString('1')

export const BIG_INT_ONE = BigInt.fromI32(1)

export const BIG_INT_TWO = BigInt.fromI32(2)

export const BIG_INT_ONE_HUNDRED = BigInt.fromI32(100)

export const BIG_INT_ONE_DAY_SECONDS = BigInt.fromI32(86400)

export const BIG_INT_ZERO = BigInt.fromI32(0)

export const LOCKUP_POOL_NUMBER = BigInt.fromI32(29)

export const FACTORY_ADDRESS = Address.fromString('0x47ee213d373f60a0d6a8c58911400ce354406b57')

export const LOCKUP_BLOCK_NUMBER = BigInt.fromI32(10959148)

export const MASTER_CHEF_ADDRESS = Address.fromString('0xed9a65ed27b69667cde22f1ac834ae0db9632C16')

export const ACE_BAR_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

export const ACE_MAKER_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

export const ACE_TOKEN_ADDRESS = Address.fromString('0x550d07a5c1591331598e4e3a38a8c32d41efc7b7')

export const ACE_USDT_PAIR_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

export const XACE_USDC_PAIR_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

export const XACE_WETH_PAIR_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

export const ACE_DISTRIBUTOR_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

export const NULL_CALL_RESULT_VALUE = '0x0000000000000000000000000000000000000000000000000000000000000001'

export const USDC_WETH_PAIR = '0xe8c21e0377fbf10546566b04b391d9c66baebc91'

export const DAI_WETH_PAIR = '0xaedb51016dbee264e456d09008f1e904e26afd2a'

export const USDT_WETH_PAIR = '0x74b9c3bf155a4f4d5925f99057eb4215b536e377'

export const ACE_USDT_PAIR = '0x0000000000000000000000000000000000000000'

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
export const MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('0')

// minimum liquidity for price to get tracked
export const MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('5')

export const WETH_ADDRESS = Address.fromString('0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270')

export const ACESWAP_WETH_USDT_PAIR_ADDRESS = Address.fromString('0x74b9c3bf155a4f4d5925f99057eb4215b536e377')

export const USDT_ADDRESS = Address.fromString('0xc2132d05d31c914a87c6611c10748aeb04b58e8f')

export const MASTER_CHEF_START_BLOCK = BigInt.fromI32(16526786)

export const SUSHISWAP_FACTORY_ADDRESS = Address.fromString('0xc35dadb65012ec5796536bd9864ed8773abc74c4')

export const SUSHISWAP_ACE_ETH_PAIR_FIRST_LIQUDITY_BLOCK = BigInt.fromI32(16526786)

export const SUSHISWAP_WETH_USDT_PAIR_ADDRESS = Address.fromString('0x55ff76Bffc3cdd9d5fdbbc2ece4528ecce45047e')

export const SUSHISWAP_ACE_ETH_PAIR_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

export const SUSHISWAP_ACE_USDT_PAIR_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')


// Bentobox constants
export const BENTOBOX_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

export const KASHI_PAIR_MEDIUM_RISK_MASTER_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

export const BENTOBOX_DEPOSIT = 'deposit'

export const BENTOBOX_TRANSFER = 'transfer'

export const BENTOBOX_WITHDRAW = 'withdraw'

export const KASHI_PAIR_MEDIUM_RISK_TYPE = 'medium'

export const PAIR_ADD_COLLATERAL = 'addCollateral'

export const PAIR_REMOVE_COLLATERAL = 'removeCollateral'

export const PAIR_ADD_ASSET = 'addAsset'

export const PAIR_REMOVE_ASSET = 'removeAsset'

export const PAIR_BORROW = 'borrow'

export const PAIR_REPAY = 'repay'


// MiniChef
export const MINI_CHEF_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

export const ACC_ACE_PRECISION = BigInt.fromString('1000000000000')

// Matic Complex Rewarder (note: putting here for now since we don't need to fill in every config file with this address)
// MasterChefV2 contract
export const MATIC_COMPLEX_REWARDER = Address.fromString('0x0000000000000000000000000000000000000000')

export const WMATIC_ADDRESS = Address.fromString('0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270')
