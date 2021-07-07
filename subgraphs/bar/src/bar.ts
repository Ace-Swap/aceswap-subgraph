import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_1E6,
  BIG_DECIMAL_ZERO,
  BIG_INT_ZERO,
  ACE_BAR_ADDRESS,
  ACE_TOKEN_ADDRESS,
  ACE_USDT_PAIR_ADDRESS,
} from 'const'
import { Address, BigDecimal, BigInt, dataSource, ethereum, log } from '@graphprotocol/graph-ts'
import { Bar, History, User } from '../generated/schema'
import { Bar as BarContract, Transfer as TransferEvent } from '../generated/AceBar/Bar'

import { Pair as PairContract } from '../generated/AceBar/Pair'
import { AceToken as AceTokenContract } from '../generated/AceBar/AceToken'

// TODO: Get averages of multiple ace stablecoin pairs
function getAcePrice(): BigDecimal {
  const pair = PairContract.bind(ACE_USDT_PAIR_ADDRESS)
  const reserves = pair.getReserves()
  return reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value0.toBigDecimal()).div(BIG_DECIMAL_1E6)
}

function createBar(block: ethereum.Block): Bar {
  const contract = BarContract.bind(dataSource.address())
  const bar = new Bar(dataSource.address().toHex())
  bar.decimals = contract.decimals()
  bar.name = contract.name()
  bar.ace = contract.ace()
  bar.symbol = contract.symbol()
  bar.totalSupply = BIG_DECIMAL_ZERO
  bar.aceStaked = BIG_DECIMAL_ZERO
  bar.aceStakedUSD = BIG_DECIMAL_ZERO
  bar.aceHarvested = BIG_DECIMAL_ZERO
  bar.aceHarvestedUSD = BIG_DECIMAL_ZERO
  bar.xAceMinted = BIG_DECIMAL_ZERO
  bar.xAceBurned = BIG_DECIMAL_ZERO
  bar.xAceAge = BIG_DECIMAL_ZERO
  bar.xAceAgeDestroyed = BIG_DECIMAL_ZERO
  bar.ratio = BIG_DECIMAL_ZERO
  bar.updatedAt = block.timestamp
  bar.save()

  return bar as Bar
}

function getBar(block: ethereum.Block): Bar {
  let bar = Bar.load(dataSource.address().toHex())

  if (bar === null) {
    bar = createBar(block)
  }

  return bar as Bar
}

function createUser(address: Address, block: ethereum.Block): User {
  const user = new User(address.toHex())

  // Set relation to bar
  user.bar = dataSource.address().toHex()

  user.xAce = BIG_DECIMAL_ZERO
  user.xAceMinted = BIG_DECIMAL_ZERO
  user.xAceBurned = BIG_DECIMAL_ZERO

  user.aceStaked = BIG_DECIMAL_ZERO
  user.aceStakedUSD = BIG_DECIMAL_ZERO

  user.aceHarvested = BIG_DECIMAL_ZERO
  user.aceHarvestedUSD = BIG_DECIMAL_ZERO

  // In/Out
  user.xAceOut = BIG_DECIMAL_ZERO
  user.aceOut = BIG_DECIMAL_ZERO
  user.usdOut = BIG_DECIMAL_ZERO

  user.xAceIn = BIG_DECIMAL_ZERO
  user.aceIn = BIG_DECIMAL_ZERO
  user.usdIn = BIG_DECIMAL_ZERO

  user.xAceAge = BIG_DECIMAL_ZERO
  user.xAceAgeDestroyed = BIG_DECIMAL_ZERO

  user.xAceOffset = BIG_DECIMAL_ZERO
  user.aceOffset = BIG_DECIMAL_ZERO
  user.usdOffset = BIG_DECIMAL_ZERO
  user.updatedAt = block.timestamp

  return user as User
}

function getUser(address: Address, block: ethereum.Block): User {
  let user = User.load(address.toHex())

  if (user === null) {
    user = createUser(address, block)
  }

  return user as User
}

function getHistory(block: ethereum.Block): History {
  const day = block.timestamp.toI32() / 86400

  const id = BigInt.fromI32(day).toString()

  let history = History.load(id)

  if (history === null) {
    const date = day * 86400
    history = new History(id)
    history.date = date
    history.timeframe = 'Day'
    history.aceStaked = BIG_DECIMAL_ZERO
    history.aceStakedUSD = BIG_DECIMAL_ZERO
    history.aceHarvested = BIG_DECIMAL_ZERO
    history.aceHarvestedUSD = BIG_DECIMAL_ZERO
    history.xAceAge = BIG_DECIMAL_ZERO
    history.xAceAgeDestroyed = BIG_DECIMAL_ZERO
    history.xAceMinted = BIG_DECIMAL_ZERO
    history.xAceBurned = BIG_DECIMAL_ZERO
    history.xAceSupply = BIG_DECIMAL_ZERO
    history.ratio = BIG_DECIMAL_ZERO
  }

  return history as History
}

export function transfer(event: TransferEvent): void {
  // Convert to BigDecimal with 18 places, 1e18.
  const value = event.params.value.divDecimal(BIG_DECIMAL_1E18)

  // If value is zero, do nothing.
  if (value.equals(BIG_DECIMAL_ZERO)) {
    log.warning('Transfer zero value! Value: {} Tx: {}', [
      event.params.value.toString(),
      event.transaction.hash.toHex(),
    ])
    return
  }

  const bar = getBar(event.block)
  const barContract = BarContract.bind(ACE_BAR_ADDRESS)

  const acePrice = getAcePrice()

  bar.totalSupply = barContract.totalSupply().divDecimal(BIG_DECIMAL_1E18)
  bar.aceStaked = AceTokenContract.bind(ACE_TOKEN_ADDRESS)
    .balanceOf(ACE_BAR_ADDRESS)
    .divDecimal(BIG_DECIMAL_1E18)
  bar.ratio = bar.aceStaked.div(bar.totalSupply)

  const what = value.times(bar.ratio)

  // Minted xAce
  if (event.params.from == ADDRESS_ZERO) {
    const user = getUser(event.params.to, event.block)

    log.info('{} minted {} xAce in exchange for {} ace - aceStaked before {} aceStaked after {}', [
      event.params.to.toHex(),
      value.toString(),
      what.toString(),
      user.aceStaked.toString(),
      user.aceStaked.plus(what).toString(),
    ])

    if (user.xAce == BIG_DECIMAL_ZERO) {
      log.info('{} entered the bar', [user.id])
      user.bar = bar.id
    }

    user.xAceMinted = user.xAceMinted.plus(value)

    const aceStakedUSD = what.times(acePrice)

    user.aceStaked = user.aceStaked.plus(what)
    user.aceStakedUSD = user.aceStakedUSD.plus(aceStakedUSD)

    const days = event.block.timestamp.minus(user.updatedAt).divDecimal(BigDecimal.fromString('86400'))

    const xAceAge = days.times(user.xAce)

    user.xAceAge = user.xAceAge.plus(xAceAge)

    // Update last
    user.xAce = user.xAce.plus(value)

    user.updatedAt = event.block.timestamp

    user.save()

    const barDays = event.block.timestamp.minus(bar.updatedAt).divDecimal(BigDecimal.fromString('86400'))
    const barXace = bar.xAceMinted.minus(bar.xAceBurned)
    bar.xAceMinted = bar.xAceMinted.plus(value)
    bar.xAceAge = bar.xAceAge.plus(barDays.times(barXace))
    bar.aceStaked = bar.aceStaked.plus(what)
    bar.aceStakedUSD = bar.aceStakedUSD.plus(aceStakedUSD)
    bar.updatedAt = event.block.timestamp

    const history = getHistory(event.block)
    history.xAceAge = bar.xAceAge
    history.xAceMinted = history.xAceMinted.plus(value)
    history.xAceSupply = bar.totalSupply
    history.aceStaked = history.aceStaked.plus(what)
    history.aceStakedUSD = history.aceStakedUSD.plus(aceStakedUSD)
    history.ratio = bar.ratio
    history.save()
  }

  // Burned xAce
  if (event.params.to == ADDRESS_ZERO) {
    log.info('{} burned {} xAce', [event.params.from.toHex(), value.toString()])

    const user = getUser(event.params.from, event.block)

    user.xAceBurned = user.xAceBurned.plus(value)

    user.aceHarvested = user.aceHarvested.plus(what)

    const aceHarvestedUSD = what.times(acePrice)

    user.aceHarvestedUSD = user.aceHarvestedUSD.plus(aceHarvestedUSD)

    const days = event.block.timestamp.minus(user.updatedAt).divDecimal(BigDecimal.fromString('86400'))

    const xAceAge = days.times(user.xAce)

    user.xAceAge = user.xAceAge.plus(xAceAge)

    const xAceAgeDestroyed = user.xAceAge.div(user.xAce).times(value)

    user.xAceAgeDestroyed = user.xAceAgeDestroyed.plus(xAceAgeDestroyed)

    // remove xAceAge
    user.xAceAge = user.xAceAge.minus(xAceAgeDestroyed)
    // Update xAce last
    user.xAce = user.xAce.minus(value)

    if (user.xAce == BIG_DECIMAL_ZERO) {
      log.info('{} left the bar', [user.id])
      user.bar = null
    }

    user.updatedAt = event.block.timestamp

    user.save()

    const barDays = event.block.timestamp.minus(bar.updatedAt).divDecimal(BigDecimal.fromString('86400'))
    const barXace = bar.xAceMinted.minus(bar.xAceBurned)
    bar.xAceBurned = bar.xAceBurned.plus(value)
    bar.xAceAge = bar.xAceAge.plus(barDays.times(barXace)).minus(xAceAgeDestroyed)
    bar.xAceAgeDestroyed = bar.xAceAgeDestroyed.plus(xAceAgeDestroyed)
    bar.aceHarvested = bar.aceHarvested.plus(what)
    bar.aceHarvestedUSD = bar.aceHarvestedUSD.plus(aceHarvestedUSD)
    bar.updatedAt = event.block.timestamp

    const history = getHistory(event.block)
    history.xAceSupply = bar.totalSupply
    history.xAceBurned = history.xAceBurned.plus(value)
    history.xAceAge = bar.xAceAge
    history.xAceAgeDestroyed = history.xAceAgeDestroyed.plus(xAceAgeDestroyed)
    history.aceHarvested = history.aceHarvested.plus(what)
    history.aceHarvestedUSD = history.aceHarvestedUSD.plus(aceHarvestedUSD)
    history.ratio = bar.ratio
    history.save()
  }

  // If transfer from address to address and not known xAce pools.
  if (event.params.from != ADDRESS_ZERO && event.params.to != ADDRESS_ZERO) {
    log.info('transfered {} xAce from {} to {}', [
      value.toString(),
      event.params.from.toHex(),
      event.params.to.toHex(),
    ])

    const fromUser = getUser(event.params.from, event.block)

    const fromUserDays = event.block.timestamp.minus(fromUser.updatedAt).divDecimal(BigDecimal.fromString('86400'))

    // Recalc xAce age first
    fromUser.xAceAge = fromUser.xAceAge.plus(fromUserDays.times(fromUser.xAce))
    // Calculate xAceAge being transfered
    const xAceAgeTranfered = fromUser.xAceAge.div(fromUser.xAce).times(value)
    // Subtract from xAceAge
    fromUser.xAceAge = fromUser.xAceAge.minus(xAceAgeTranfered)
    fromUser.updatedAt = event.block.timestamp

    fromUser.xAce = fromUser.xAce.minus(value)
    fromUser.xAceOut = fromUser.xAceOut.plus(value)
    fromUser.aceOut = fromUser.aceOut.plus(what)
    fromUser.usdOut = fromUser.usdOut.plus(what.times(acePrice))

    if (fromUser.xAce == BIG_DECIMAL_ZERO) {
      log.info('{} left the bar by transfer OUT', [fromUser.id])
      fromUser.bar = null
    }

    fromUser.save()

    const toUser = getUser(event.params.to, event.block)

    if (toUser.bar === null) {
      log.info('{} entered the bar by transfer IN', [fromUser.id])
      toUser.bar = bar.id
    }

    // Recalculate xAce age and add incoming xAceAgeTransfered
    const toUserDays = event.block.timestamp.minus(toUser.updatedAt).divDecimal(BigDecimal.fromString('86400'))

    toUser.xAceAge = toUser.xAceAge.plus(toUserDays.times(toUser.xAce)).plus(xAceAgeTranfered)
    toUser.updatedAt = event.block.timestamp

    toUser.xAce = toUser.xAce.plus(value)
    toUser.xAceIn = toUser.xAceIn.plus(value)
    toUser.aceIn = toUser.aceIn.plus(what)
    toUser.usdIn = toUser.usdIn.plus(what.times(acePrice))

    const difference = toUser.xAceIn.minus(toUser.xAceOut).minus(toUser.xAceOffset)

    // If difference of ace in - ace out - offset > 0, then add on the difference
    // in staked ace based on xAce:Ace ratio at time of reciept.
    if (difference.gt(BIG_DECIMAL_ZERO)) {
      const ace = toUser.aceIn.minus(toUser.aceOut).minus(toUser.aceOffset)
      const usd = toUser.usdIn.minus(toUser.usdOut).minus(toUser.usdOffset)

      log.info('{} recieved a transfer of {} xAce from {}, ace value of transfer is {}', [
        toUser.id,
        value.toString(),
        fromUser.id,
        what.toString(),
      ])

      toUser.aceStaked = toUser.aceStaked.plus(ace)
      toUser.aceStakedUSD = toUser.aceStakedUSD.plus(usd)

      toUser.xAceOffset = toUser.xAceOffset.plus(difference)
      toUser.aceOffset = toUser.aceOffset.plus(ace)
      toUser.usdOffset = toUser.usdOffset.plus(usd)
    }

    toUser.save()
  }

  bar.save()
}
