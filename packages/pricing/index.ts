import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_1E6,
  BIG_DECIMAL_ONE,
  BIG_DECIMAL_ZERO,
  FACTORY_ADDRESS,
  ACESWAP_WETH_USDT_PAIR_ADDRESS,
  ACE_TOKEN_ADDRESS,
  ACE_USDT_PAIR_ADDRESS,
  SUSHISWAP_FACTORY_ADDRESS,
  SUSHISWAP_ACE_ETH_PAIR_FIRST_LIQUDITY_BLOCK,
  SUSHISWAP_ACE_USDT_PAIR_ADDRESS,
  SUSHISWAP_WETH_USDT_PAIR_ADDRESS,
  USDT_ADDRESS,
  WETH_ADDRESS,
} from 'const'
import { Address, BigDecimal, BigInt, ethereum, log } from '@graphprotocol/graph-ts'

import { Factory as FactoryContract } from 'exchange/generated/Factory/Factory'
import { Pair as PairContract } from 'exchange/generated/Factory/Pair'

export function getUSDRate(token: Address, block: ethereum.Block): BigDecimal {
  let usdt = BIG_DECIMAL_ONE

  if (token != USDT_ADDRESS) {
    let address = block.number.le(BigInt.fromI32(16650000))
      ? SUSHISWAP_WETH_USDT_PAIR_ADDRESS
      : ACESWAP_WETH_USDT_PAIR_ADDRESS

    const tokenPriceETH = getEthRate(token, block)

    const pair = PairContract.bind(address)

    const reserves = pair.getReserves()

    const reserve0 = reserves.value0.toBigDecimal().times(BIG_DECIMAL_1E18)

    const reserve1 = reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18)

    const ethPriceUSD = reserve1.div(reserve0).div(BIG_DECIMAL_1E6).times(BIG_DECIMAL_1E18)

    return ethPriceUSD.times(tokenPriceETH)
  }

  return usdt
}

export function getEthRate(token: Address, block: ethereum.Block): BigDecimal {
  let eth = BIG_DECIMAL_ONE

  if (token != WETH_ADDRESS) {
    const factory = FactoryContract.bind(
      block.number.le(BigInt.fromI32(16650000)) ? SUSHISWAP_FACTORY_ADDRESS : FACTORY_ADDRESS
    )

    const address = factory.getPair(token, WETH_ADDRESS)

    if (address == ADDRESS_ZERO) {
      log.info('Adress ZERO...', [])
      return BIG_DECIMAL_ZERO
    }

    const pair = PairContract.bind(address)

    const reserves = pair.getReserves()

    eth =
      pair.token0() == WETH_ADDRESS
        ? reserves.value0.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value1.toBigDecimal())
        : reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value0.toBigDecimal())

    return eth.div(BIG_DECIMAL_1E18)
  }

  return eth
}

export function getAcePrice(block: ethereum.Block): BigDecimal {
  if (block.number.lt(SUSHISWAP_ACE_ETH_PAIR_FIRST_LIQUDITY_BLOCK)) {
    // If before sushiswap ace-eth pair creation and liquidity added, return zero
    return BIG_DECIMAL_ZERO
  } else if (block.number.lt(BigInt.fromI32(16650000))) {
    // Else if before sushiswap ace-usdt pair creation (get price from eth ace-eth pair above)
    return getUSDRate(ACE_TOKEN_ADDRESS, block)
  } else {
    // Else get price from either sushi or ace usdt pair depending on space-time
    const pair = PairContract.bind(
      block.number.le(BigInt.fromI32(16650000)) ? SUSHISWAP_ACE_USDT_PAIR_ADDRESS : ACE_USDT_PAIR_ADDRESS
    )
    const reserves = pair.getReserves()
    return reserves.value1
      .toBigDecimal()
      .times(BIG_DECIMAL_1E18)
      .div(reserves.value0.toBigDecimal())
      .div(BIG_DECIMAL_1E6)
  }
}
