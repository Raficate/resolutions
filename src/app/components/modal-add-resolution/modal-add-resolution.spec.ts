import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAddResolution } from './modal-add-resolution';

describe('ModalAddResolution', () => {
  let component: ModalAddResolution;
  let fixture: ComponentFixture<ModalAddResolution>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAddResolution]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAddResolution);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
