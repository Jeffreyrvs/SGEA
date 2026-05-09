import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateEstresoresDto } from './create-estresores.dto';

function makeDto(factores: unknown[]): CreateEstresoresDto {
  return plainToInstance(CreateEstresoresDto, { factores });
}

describe('CreateEstresoresDto', () => {
  it('acepta 1 factor válido', async () => {
    const dto = makeDto([{ factor_id: 1, peso: 3 }]);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('acepta 8 factores válidos', async () => {
    const dto = makeDto([
      { factor_id: 1, peso: 1 }, { factor_id: 2, peso: 2 },
      { factor_id: 3, peso: 3 }, { factor_id: 4, peso: 4 },
      { factor_id: 5, peso: 5 }, { factor_id: 6, peso: 0 },
      { factor_id: 7, peso: 1 }, { factor_id: 8, peso: 2 },
    ]);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza array vacío', async () => {
    const dto = makeDto([]);
    const errors = await validate(dto);
    const factoresError = errors.find((e) => e.property === 'factores');
    expect(factoresError?.constraints).toHaveProperty('arrayMinSize');
  });

  it('rechaza 9 factores', async () => {
    const dto = makeDto([
      { factor_id: 1, peso: 1 }, { factor_id: 2, peso: 2 },
      { factor_id: 3, peso: 3 }, { factor_id: 4, peso: 4 },
      { factor_id: 5, peso: 5 }, { factor_id: 6, peso: 0 },
      { factor_id: 7, peso: 1 }, { factor_id: 8, peso: 2 },
      { factor_id: 1, peso: 3 },
    ]);
    const errors = await validate(dto);
    const factoresError = errors.find((e) => e.property === 'factores');
    expect(factoresError?.constraints).toHaveProperty('arrayMaxSize');
  });

  it('rechaza factor_id fuera de rango 1-8', async () => {
    const dto = makeDto([{ factor_id: 9, peso: 3 }]);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rechaza peso fuera de rango 0-5', async () => {
    const dto = makeDto([{ factor_id: 1, peso: 6 }]);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
