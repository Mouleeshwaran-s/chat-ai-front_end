import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SharedService } from '../../core/service/shared.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [RouterLink]
})
export class HomeComponent implements OnInit {
  constructor() { }

  ngOnInit() {
    // Initialize any necessary data or services here
  }

}
