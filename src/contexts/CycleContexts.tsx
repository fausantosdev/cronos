import {
  ReactNode,
  createContext,
  useState,
  useReducer,
  useEffect,
} from 'react'
import { differenceInSeconds } from 'date-fns'

import { ICycle, cyclesReducer } from '../reducers/cycles/reducer'
import {
  ActionTypes,
  addNewCycleAction,
  markCurrentCycleAsFinishedAction,
} from '../reducers/cycles/actions'

interface ICreateCycleData {
  task: string
  minutesAmount: number
}

interface ICycleContext {
  cycles: ICycle[]
  activeCycle: ICycle | undefined
  activeCycleId: string | null
  amountSecondPassed: number
  markCurrentCycleAsFinished: () => void
  setSecondsPassed: (seconds: number) => void
  createNewCycle: (data: ICreateCycleData) => void
  interruptCurrentCycle: () => void
}

export const CycleContext = createContext({} as ICycleContext)

type CycleContextProviderPropTypes = {
  children: ReactNode
}

export function CycleContextProvider({
  children,
}: CycleContextProviderPropTypes) {
  //     estado     , disparador
  const [cyclesState, dispatch] = useReducer(
    cyclesReducer,
    {
      cycles: [],
      activeCycleId: null,
    },
    /* 
      Função disparada assim que reducer é criado
      para se recuperar os dados iniciais do mesmo(pode ser de uma api, storage, arquivos, etc)
    */
    (initialState) => {
      const storegeStateAsJson = localStorage.getItem(
        '@cronos:cycles-state-1.0.0',
      )

      if (storegeStateAsJson) return JSON.parse(storegeStateAsJson)

      return initialState
    },
  ) // useState<ICycle[]>([])

  const { cycles, activeCycleId } = cyclesState

  const activeCycle = cycles.find((cycle) => cycle.id === activeCycleId)

  // const [activeCycleId, setActiveCycleId] = useState<string | null>(null)
  const [amountSecondPassed, setAmountSecondPassed] = useState(() => {
    if (activeCycle) {
      return differenceInSeconds(new Date(), new Date(activeCycle.startDate))
    }

    return 0
  }) // Quantidade de segundos que passaram desde a criação/ativação do ciclo

  useEffect(() => {
    const stateJson = JSON.stringify(cyclesState)
    localStorage.setItem('@cronos:cycles-state-1.0.0', stateJson)
  }, [cyclesState])

  function setSecondsPassed(seconds: number) {
    setAmountSecondPassed(seconds)
  }

  function createNewCycle(data: ICreateCycleData) {
    const id = String(new Date().getTime())

    const newCycle: ICycle = {
      id,
      task: data.task,
      minutes: data.minutesAmount,
      startDate: new Date(),
    }

    dispatch(addNewCycleAction(newCycle))
    setAmountSecondPassed(0)
  }

  // Interrompe o ciclo ativo
  function interruptCurrentCycle() {
    dispatch({
      type: ActionTypes.INTERUPT_CURRENT_CYCLE,
      payload: {
        activeCycleId,
      },
    })
  }

  function markCurrentCycleAsFinished() {
    dispatch(markCurrentCycleAsFinishedAction())
  }

  return (
    <CycleContext.Provider
      value={{
        cycles,
        activeCycle,
        activeCycleId,
        amountSecondPassed,
        markCurrentCycleAsFinished,
        setSecondsPassed,
        createNewCycle,
        interruptCurrentCycle,
      }}
    >
      {children}
    </CycleContext.Provider>
  )
}
