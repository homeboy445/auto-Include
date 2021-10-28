/**
 * A class to offer functionalities of a general Queue.
 * Available methods:
 * @push_front push any element to front of the queue. params: 1(any)
 * @front returns the first element of the queue.
 * @pop_front removes the first element of the queue.
 * @get_queue returns the queue.
 * @is_empty returns true if the queue is empty and false otherwise.
 */
class Queue {
  constructor() {
    this.queue = [];
  }
  push_front(ele) {
    if (ele === undefined) {
      return;
    }
    this.queue = [ele].concat(this.queue);
  }
  front() {
    if (this.queue.length === 0) {
      return -1;
    }
    return this.queue[0];
  }
  pop_front() {
    if (this.queue.length === 0) {
      return [];
    }
    this.queue.splice(0, 1);
  }
  get_queue() {
    //For debugging purposes only.
    return this.queue;
  }
  is_empty() {
    return this.queue.length === 0;
  }
}

module.exports = {
  Queue,
};
